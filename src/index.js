import csv from "csv-parser"
import fs from "fs"
import express from "express"
import moment from "moment"
import zmq from "zeromq"
import pg from "pg"
import dns from "dns"

// Using version 6 (beta) ZMQ, Node version 14

const app = express();
app.use(express.json());

const DB_HOST = "pg";
const DB_PORT = 3000;
const DB_URL = `http://${DB_HOST}:${DB_PORT}/`;

const C_HOST = "http://c-srv";
const C_PORT = 3000;
const C_URL = `http://${C_HOST}:${C_PORT}/`;

let LAST_SYNC = null;

const SOCK = new zmq.Publisher
const PUB_NAME = 'e-srv'; // Replace 'container2' with the actual container name

// Find the publisher (this server's) ip
dns.lookup(PUB_NAME, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${PUB_NAME}:`, err);
  } else {
    console.log(`The IP address of ${PUB_NAME} is: ${address}`);
    pub_messages_to(address, "test");
  }
});


async function pub_messages_to(pub_address, topic) {
  const socketAddr = "tcp://"+pub_address+":5432"
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




