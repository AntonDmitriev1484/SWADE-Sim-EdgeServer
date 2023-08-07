import csv from "csv-parser"
import fs, { write } from "fs"
import express from "express"
import moment from "moment"
import zmq from "zeromq"
import pg from "pg"
import dns from "dns"
import fetch from "node-fetch"
import * as f from "../util/functions.js"
import multer from "multer"

// Using version 6 (beta) ZMQ, Node version 14

const app = express();
app.use(express.json());

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;
const DB_HOST = "pg";
const C_HOST = "c-srv";
const PUB_NAME = `e-srv${process.env.EDGE_ID}`;
const USER = { username: process.env.USERNAME};

const SOCK = new zmq.Publisher({
  sendHighWaterMark: 1,
  sendTimeout: 0,
  heartbeatInterval: 0
});

// Honestly I think the solution might just be to figure out a good chunking threshold

const DB_CLIENT = new pg.Client({
  host: `pg${process.env.EDGE_ID}`,
  port: PG_PORT,
  database: 'postgres',
  user: 'postgres',
  password: 'pass',
})


function write_csv_local_metadata(metadata_filename) {
  let metadata = "";
  metadata = `Groups:\n${process.env.LOCAL_GROUP}: RW\nUsers:\n${process.env.USERNAME}: RW\n`
  fs.writeFile(`data/${metadata_filename}`, metadata, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('File written successfully.');
    }
  })
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // On edge, all files will be stored in the same directory data/
    const dir_path = `data`
    cb(null, dir_path)
  },
  filename: function (req, file, cb) {
    const metadata_filename = req.body.filename.replace(/\./g, '_')+'_meta.txt';
    console.log('Metadata filename '+metadata_filename);
    write_csv_local_metadata(metadata_filename)
    cb(null, req.body.filename)
  }
})
const upload = multer({ storage: storage });



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
    method: 'POST',
    headers: {
        "accept": "application/json",
        "content-type": "application/json"
    },
    body:
      JSON.stringify({
        "topics": [
          {
            "name": "live_data"
          },
          {
            "name": "file_upload",
            "bucket": `e-srv${process.env.EDGE_ID}`
          }
      ]
      })
  });

  // For now, the edge server will register to both topics

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
    // Return a promise to build a publisher function
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
          //message["user"] = USER; // NOTICE: user object always gets added into any message!
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


////////////////////////////////////////////////////////////////////////////////


init_connections()
.then( values => {

  console.log('All initialization promises resolved!');

  const pub = values[2]; // Grab our publisher function

  function pub_csv_cloud(path, filename) {
      const CHUNK_SIZE = 1000;
      let COUNT = 0; // Number of lines read from file
      let CHUNKS_READ = 1;
      let CHUNK = [];
      // Request holds path where this file will be stored on cloud filesystem
      fs.createReadStream(path)
      .pipe(csv())
      .on('headers', (headers) => {
        pub("file_upload", JSON.stringify({
          "user": USER,
          "bucket": `e-srv${process.env.EDGE_ID}`,
          "path": `test/`,
          "filename": `${filename}`,
          "chunk": headers
        }))
      })
      .on('data', (row) => {
        COUNT++;
        CHUNK.push(row); //row is a JSON here
        if (COUNT >= CHUNKS_READ*CHUNK_SIZE) {
          pub("file_upload", JSON.stringify({
            "user": USER,
            "bucket": `e-srv${process.env.EDGE_ID}`,
            "path": `test/`,
            "filename": `${filename}`,
            "chunk": CHUNK
          }))
          CHUNK = [];
          CHUNKS_READ ++;
        }
      })
      .on('end', () => {
        // When chunk is null, the cloud server will know to stop writing
        console.log(` Edge wrote: ${COUNT} lines, ${CHUNKS_READ} chunks.`);
        COUNT = 0;
        CHUNKS_READ = 0;
        CHUNK.push(null);
        // Publish the final chunk
        pub("file_upload", JSON.stringify({
          "user": USER,
          "bucket": `e-srv${process.env.EDGE_ID}`,
          "path": `test/`,
          "filename": `${filename}`,
          "chunk": CHUNK
        }))
        CHUNK = [];
      });
  }

  app.post('/query-ingestor', (req, res) => {

    console.log('Received query!');
    console.log(req.body.query);

    // Query interception -> application to local pg -> then send to cloud
    DB_CLIENT.query(req.body.query)
    .then(x => {

        console.log('Query applied to edge postgres successfully!');

        pub("live_data", JSON.stringify({
          "query": req.body.query
        }))
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

  app.post('/local-write', upload.single('file'), (req, res) => {
    // Multer middleware handles writing local file and local metadata file.
  });

  app.post('/cloud-write', upload.single('file'), (req, res) => {
    // Multer middleware handles writing local file and local metadata file.
    pub_csv_cloud(`data/${req.body.filename}`, req.body.filename); // My code publishes this file in chunks to the cloud
    // Broker will create a metadata file for the cloud version
  });

  app.post('/local-read', (req, res) => {

    //Will only be reading one file at a time, don't want to deal with async/await bullshit right now
      // Iterate through each file
      req.body.files.forEach(file => {

        query_csv(file, req.body.condition, (full_query_results)=> {
          console.log(full_query_results);
          res.send(JSON.stringify(full_query_results)); // Res needs to accumulate values
        })

      });
    
  })


})
.catch( err => {
  console.log(`Problem initializing edge server connections: ${err}`);
});

function query_csv(name, value, on_complete) {
  let query_results = [];
  fs.createReadStream(`data/${name}`)
  .pipe(csv())
  .on('data', 
    (row) => {
      if ((row['energy(kWh/hh)'].trim() <= (value+0.0001)) && (row['energy(kWh/hh)'].trim() >= (value-0.0001))) {
        query_results.push(row);
      }
  })
  .on('end', () => {
    console.log('Query completed');
    on_complete(query_results);
  });
}

function check_ACL(name) {
  // Do this later
}

function metadata_of(filename) {
  // Returns name of the corresponding metadata
  return filename.replace(/\./g, '_')+'_meta.txt';
}


app.listen(EXPRESS_PORT, () => {
  console.log("Listening on port 3000");
});