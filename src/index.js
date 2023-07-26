import csv from "csv-parser"
import fs from "fs"
import express from "express"
import moment from "moment"
import zmq from "zeromq"
import pg from "pg"
import dns from "dns"
import * as f from "../util/functions.js"

// Using version 6 (beta) ZMQ, Node version 14

const app = express();
app.use(express.json());

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;

const DB_HOST = "pg";
const C_HOST = "c-srv";

// THIS WAS e-srv1 before!
const PUB_NAME = `e-srv${process.env.EDGE_ID}`; // Must be the alias for e-srv on swade-net
// PUB_NAME is not necessarily going to be e-srv1

const SOCK = new zmq.Publisher

const DB_CLIENT = new pg.Client({
  host: 'pg',
  port: PG_PORT,
  database: 'postgres',
  user: 'postgres',
  password: 'pass',
})

await new Promise(res => setTimeout(res, 5000)); 
// Give pg enough time to start
// Write a connect with retry loop around DB_CLIENT.connect()

function init_query_endpoints() {
  //Only initialize query endpoints once PG is set up
  app.post('/query-ingestor', (req, res) => {

    console.log('Received query!');
    console.log(req.body.query);
  
    res.send({message: "Query processed successfully!"});
  }
  );
}

// Repeatedly try to connect
// Connect client to Postgres instance
// Try connecting until the server becomes available
DB_CLIENT.connect().then( x => {
      console.log('Client connected to pg')
      //init_query_endpoints();
  }
)
.catch( error => {
      console.log('Error connecting to pg: '+error);
  }
);

console.log('Registering edge server with cloud');
// Register edge server with cloud server
f.HOFetch(`http://${C_HOST}:3000/register`,
{
  method: 'GET',
  headers: {
      "accept": "application/json",
      "content-type": "application/json"
  }
},
response => {
  // Super janky solution. Fix later.
  // Basically on register, cloud server tells the edge server what its swade-net ip is in the response
  // then we bind the tcp port with that address instead of what DNS.lookup was providing (edge-net-n) address
  build_pub_function(response.swadenetIP)
    .then(
      (pub) => {

        app.post('/query-ingestor', (req, res) => {

          console.log('Received query!');
          console.log(req.body.query);

          // Really we want query to occur before pub.
          // Merge these two into one ordered pipeline later
    
          // Query interception + send
          pub("Test", req.body.query)
          .then( x => {
            res.send({message: "Query sent to cloud successfully!"});
          })
          .catch(err => {
            res.send({message: "Query send to cloud failed!"});
          })

          // Query application
          DB_CLIENT.query(req.body.query)
          .then(x => {
            console.log('Query applied to edge postgres successfully!');
          }).catch(err => {
            console.log('Query failed on edge postgres: '+err);
          })
        
        }
        );

    }).catch();

    // Only on DB Connect AND DNS Lookup, is when we can set up our query ingestor endpoint.
}
)

/*
// Find the publisher (this server's) ip
dns.lookup(PUB_NAME, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${PUB_NAME}:`, err);
  } else {
    console.log(`The IP address of ${PUB_NAME} is: ${address}`);

    //Basically just wraps socket.bind() & socket.send()?
    //At some point, maybe we should expand this to also do the database storage?
    //We should only pub if we sent to database successfully

    // Here the address we're finding is the edge-net address
    // we might need it to bind to the swade-net address
    // The server is being properly registered to the cloud server with its swade-net address

    build_pub_function(address)
    .then(
      (pub) => {

        console.log('Registering edge server with cloud');
        // Register edge server with cloud server
        f.HOFetch(`http://${C_HOST}:3000/register`,
        {
          method: 'GET',
          headers: {
              "accept": "application/json",
              "content-type": "application/json"
          }
        },
        res => {
          console.log(res.message);
        }
        )

        app.post('/query-ingestor', (req, res) => {

          console.log('Received query!');
          console.log(req.body.query);

          // Really we want query to occur before pub.
          // Merge these two into one ordered pipeline later
    
          // Query interception + send
          pub("Test", req.body.query)
          .then( x => {
            res.send({message: "Query sent to cloud successfully!"});
          })
          .catch(err => {
            res.send({message: "Query send to cloud failed!"});
          })

          // Query application
          DB_CLIENT.query(req.body.query)
          .then(x => {
            console.log('Query applied to edge postgres successfully!');
          }).catch(err => {
            console.log('Query failed on edge postgres: '+err);
          })
        
        }
        );

    }).catch();

    // Only on DB Connect AND DNS Lookup, is when we can set up our query ingestor endpoint.

  }
});
*/
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


app.listen(EXPRESS_PORT, () => {
  console.log("E-srv listening on port 3000");
});


async function pub_messages_to(pub_address, topic) {
  const socketAddr = "tcp://"+pub_address+":"+ZMQ_PORT;
  try {
    await SOCK.bind(socketAddr);
    console.log ("Bound to socket "+socketAddr);

    while (true) {
      try {
        await SOCK.send(["test", "meow!"]);
        console.log("Sent MIME");
      }
      catch (err) {
        console.log ("Error sending MIME");
      }
      await new Promise(resolve => { setTimeout(resolve, 1000) })
    }

  }
  catch (err) {
    console.log("error connecting SOCKet", err)
  }

}




// docker network rm test-postgres-sync_edge-net1, test-postgres-sync_edge-net2, test-postgres-sync_repo-net, test-postgres-sync_swade-net
// or maybe just remove all of them lol