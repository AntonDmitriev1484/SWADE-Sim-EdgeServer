import csv from "csv-parser"
import fs from "fs"
import express from "express"
import moment from "moment"
import zmq from "zeromq"
import pg from "pg"
import dns from "dns"
import fetch from "node-fetch"
import * as f from "../util/functions.js"

// Using version 6 (beta) ZMQ, Node version 14

const app = express();
app.use(express.json());

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;

const DB_HOST = "pg";
const C_HOST = "c-srv";

const PUB_NAME = `e-srv${process.env.EDGE_ID}`;

const SOCK = new zmq.Publisher

const DB_CLIENT = new pg.Client({
  host: `pg${process.env.EDGE_ID}`,
  port: PG_PORT,
  database: 'postgres',
  user: 'postgres',
  password: 'pass',
})

// Promise resolution gives a success / failure message
async function connect_postgress() {
  await new Promise(res => setTimeout(res, 5000)); 
  // Give pg enough time to start
  // Write a connect with retry loop around DB_CLIENT.connect()

  return new Promise((resolve, reject)=> {
    DB_CLIENT.connect().then( x => {
      resolve(`Connected to pg${process.env.EDGE_ID}.`);
    }
    )
    .catch( err => {
      reject(`Connection to pg${process.env.EDGE_ID} failed.`);
    })
  })
}

// Promise resolution returns cloud response
async function cloud_registration() {
  await new Promise(res => setTimeout(res, 5000)); 
  return fetch(`http://${C_HOST}:3000/register`,
  {
    method: 'GET',
    headers: {
        "accept": "application/json",
        "content-type": "application/json"
    }
  });

}

// Promise resolution returns a publisher function
async function build_publisher() {

  // First find this container's ip address
  // It works async but you need to wrap it in a promise (stupidity)
  const lookupPromise = new Promise((resolve,reject)=> {
    dns.lookup(PUB_NAME, (err, address, family) => {
        if (err) {
          reject(`Error resolving IP address for ${PUB_NAME}: ${err}`);
        } else {
          resolve(address); // Will resolve to the value of address
        }
      });
  });

  // Next try resolving the container's ip, and using it to build a pub function
  try{
    // Resolution case
    const address = await lookupPromise;
    console.log(`This server is at address: ${address}`);
    return build_pub_function(address);
  }
  catch (err) {
    // Rejection case
    console.log(err);
  }
}

// Asynchronously bind a socket into a publisher function
// We will later use this publisher function
async function build_pub_function(pub_address) {

  // Curried function, generates a pub_message function.
  // Any (topic, message) passed to this function will publish to
  // the socket bound to pub_address
  const socketAddr = "tcp://"+pub_address+":"+ZMQ_PORT;
    try {
      await SOCK.bind(socketAddr);
      console.log ("Bound to socket "+socketAddr);
 
      const pub_function = 
      async (topic, message) => {
          SOCK.send([topic, message]);
      }

       return pub_function;

    }
    catch (err) {
      console.log("error connecting SOCKet", err)
    }

}

async function init_connections() {
  // Results will be in order of array elements
  return Promise.all([connect_postgress(), cloud_registration(), build_publisher()]);
}


try {
  let values = await init_connections();
  console.log('All initialization promises resolved!');

  const pub = values[2]; // Grab our publisher function

  app.post('/query-ingestor', (req, res) => {

    console.log('Received query!');
    console.log(req.body.query);

    // Query interception -> application to local pg -> then send to cloud
    DB_CLIENT.query(req.body.query)
    .then(x => {

        console.log('Query applied to edge postgres successfully!');

        pub("Test", req.body.query)
        .then( x => {
          res.send({message: "Query sent to cloud successfully!"});
        })
        .catch(err => {
          res.send({message: "Query send to cloud failed!"});
        })

    }).catch(err => {
      console.log('Query failed on edge postgres: '+err);
    })
  
  }
  );
}
catch (err) {
  console.log(`Problem initializing edge server connections: ${err}`);
}



app.listen(EXPRESS_PORT, () => {
  console.log("Listening on port 3000");
});


// async function pub_messages_to(pub_address, topic) {
//   const socketAddr = "tcp://"+pub_address+":"+ZMQ_PORT;
//   try {
//     await SOCK.bind(socketAddr);
//     console.log ("Bound to socket "+socketAddr);

//     while (true) {
//       try {
//         await SOCK.send(["test", "meow!"]);
//         console.log("Sent MIME");
//       }
//       catch (err) {
//         console.log ("Error sending MIME");
//       }
//       await new Promise(resolve => { setTimeout(resolve, 1000) })
//     }

//   }
//   catch (err) {
//     console.log("error connecting SOCKet", err)
//   }

// }




// docker network rm test-postgres-sync_edge-net1, test-postgres-sync_edge-net2, test-postgres-sync_repo-net, test-postgres-sync_swade-net
// or maybe just remove all of them lol





// await new Promise(res => setTimeout(res, 5000)); 
// Give pg enough time to start
// Write a connect with retry loop around DB_CLIENT.connect()

// Repeatedly try to connect
// Connect client to Postgres instance
// Try connecting until the server becomes available
// DB_CLIENT.connect().then( x => {
//       console.log('Client connected to pg')
//       //init_query_endpoints();
//   }
// )
// .catch( error => {
//       console.log('Error connecting to pg: '+error);
//   }
// );

// console.log('Registering edge server with cloud');
// // Register edge server with cloud server
// f.HOFetch(`http://${C_HOST}:3000/register`,
// {
//   method: 'GET',
//   headers: {
//       "accept": "application/json",
//       "content-type": "application/json"
//   }
// },
// response => {
//   // Super janky solution. Fix later.
//   // Basically on register, cloud server tells the edge server what its swade-net ip is in the response
//   // then we bind the tcp port with that address instead of what DNS.lookup was providing (edge-net-n) address
//   build_pub_function(response.swadenetIP)
//     .then(
//       (pub) => {

        // app.post('/query-ingestor', (req, res) => {

        //   console.log('Received query!');
        //   console.log(req.body.query);

        //   // Really we want query to occur before pub.
        //   // Merge these two into one ordered pipeline later
    
        //   // Query interception + send
        //   pub("Test", req.body.query)
        //   .then( x => {
        //     res.send({message: "Query sent to cloud successfully!"});
        //   })
        //   .catch(err => {
        //     res.send({message: "Query send to cloud failed!"});
        //   })

        //   // Query application
        //   DB_CLIENT.query(req.body.query)
        //   .then(x => {
        //     console.log('Query applied to edge postgres successfully!');
        //   }).catch(err => {
        //     console.log('Query failed on edge postgres: '+err);
        //   })
        
        // }
        // );

//     }).catch();

//     // Only on DB Connect AND DNS Lookup, is when we can set up our query ingestor endpoint.
// }
// )