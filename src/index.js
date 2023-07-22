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

const cloudContainerName = 'c-srv'; // Replace 'container2' with the actual container name
let CLOUD_IP = 0;

// Use docker dns to figure out c-srvs ip
// THIS IS ASYNC FUN FACT!
dns.lookup(cloudContainerName, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${containerName}:`, err);
  } else {
    CLOUD_IP = address
    console.log(`The IP address of ${cloudContainerName} is: ${address}`);
  }
});

// We want multiple nodes to publish to the cloud server
// this way c-srv can be a subscriber without having to
// know about the urls of all edge servers

const sock = new zmq.Publisher

await sock.bind("tcp://"+CLOUD_IP+":3000");
//sock.connect("tcp://"+CLOUD_IP+":3000");

console.log("Publisher bound to port 3000")

while (true) {
  console.log("sending a multipart message envelope")
  await sock.send(["test", "meow!"])
  await new Promise(resolve => { setTimeout(resolve, 500) })
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

app.listen(3000);




