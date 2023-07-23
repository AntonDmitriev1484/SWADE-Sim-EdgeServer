import csv from "csv-parser"
import fs from "fs"
import express from "express"
import moment from "moment"
import zmq from "zeromq"

import pg from "pg"
import dns from "dns"
//import zmq from "zeromq"
// importing (using) zmq segfaults my container! fun!
// going to use google pub/sub instead

const app = express();
app.use(express.json());

const DB_HOST = "http://pg";
const DB_PORT = 3000;
const DB_URL = DB_HOST + ":" + DB_PORT + "/";

const C_HOST = "http://c-srv";
const C_PORT = 3000;
const C_URL = C_HOST + ":" + C_PORT + "/";

const cloudContainerName = 'e-srv'; // Replace 'container2' with the actual container name

// Use docker dns to figure out c-srvs ip
// THIS IS ASYNC FUN FACT! Is it?
// I think the solution is to nest
await dns.lookup(cloudContainerName, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${containerName}:`, err);
  } else {
    console.log(`The IP address of ${cloudContainerName} is: ${address}`);
    send_messages(address);
    // ADDR = address; //Why is this 0
    // console.log("address: "+address+" cloud ip "+ADDR);
    // is it shadowing the variable? lexical scoping don't work good
  }
});


async function send_messages(address) {
  const socketAddr = "tcp://"+address+":5432"
  //const socketAddr = "tcp://c-srv:3000"
  const sock = new zmq.Publisher
  try {
    await sock.bind(socketAddr); //Swapping this to connect removes the error
    console.log ("socket connected to "+socketAddr);

    while (true) {
      try {
        await sock.send(["test", "meow!"])
        console.log("sent a multipart message envelope")
      }
      catch (err) {
        console.log ("error sending MIME to cloud");
      }
      await new Promise(resolve => { setTimeout(resolve, 1000) })
    }

  }
  catch (err) {
    console.log("error connecting socket", err)
  }

  //sock.connect("tcp://"+CLOUD_IP+":3000");


}



// OLD zmq syntax
// const SOCK = zmq.socket("pub");
// SOCK.bindSync("tcp://"+CLOUD_IP+":"+C_PORT);

// // const PUB = zmq.Publisher();
// // PUB.bind(C_URL);

// const timer = 1000;
// setInterval(() => {
//   console.log("Edge sending zmq message");
//   SOCK.send(["test", "Published a msg with ZMQ"]);
// }, 
// timer);

let LAST_SYNC = null;


// It seems the DB triggers act directly on the database
// maybe I can get them to invoke a function on an e-srv REST API.

// Listens for a sync request from the cloud server
app.get('/sync', (req, res) => {
  // Find all data that is not syncd to the cloud in water.csv
  // Send that data to c-srv in res
  const filename = "water.csv";
  const path = "./data/"+filename;

  const send_result = (unsynced) => {
    res.send(unsynced);
    LAST_SYNC = moment();
  }

  apply_to_unsynced_entries(path, send_result);

});

app.post('/fwd-query', (req, res) => {
  // Get query string out of req
  // forward that query as a POST to c-srv
  // (don't necessarily need to forward, you could send it straight from the trigger)
  console.log('Got signal from trigger');
});

// path: Where the data entries we need to inspect are
// on_end: lambda function to use when you finish accumulating unsynced entries
function apply_to_unsynced_entries(path, on_end) {
  let unsynced = [];

  // This is async, need to write as functional
  fs.createReadStream(path)
  .pipe(csv())
  .on('data', 
    (row) => {
      const unsync = (LAST_SYNC === null) || (moment(row.last_update) > (LAST_SYNC));
      if (unsync) { //If the data is unsynced by timestamp
        unsynced.push(row);
      }
  })
  .on('end', () => {
    on_end(unsynced)
    console.log('CSV file parsed successfully.');
  });
}

//app.listen(3000);




