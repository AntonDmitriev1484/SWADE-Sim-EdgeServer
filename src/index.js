import csv from "csv-parser"
import fs from "fs"
import express from "express"
import moment from "moment"

const app = express();
app.use(express.json());

// Hostname that our dummy cloud server container will have 
// on docker network 'edge-test'
const HOST = "http://c-srv"
const ENDPOINT = ":3000/";
const URL = HOST+ENDPOINT;

let LAST_SYNC = null;

// Listens for a sync request from the cloud server
app.get('/sync', (req, res) => {
  // Find all data that is not syncd to the cloud
  // Send that data to c-srv in res\
  const filename = "water.csv"; //???
  const path = "./data/"+filename;

  let unsynced = get_unsynced_entries(path);
  res.send(unsynced);

});

function update_timestamps(unsynced) {
  // Options for updating
  // 1. Read CSV file into big array that lives in the script, perform all R/W there
  // 2. Keep track of rows that need to be changed, copy/re-write the file in a second pass

  fs.createReadStream(path)
  .pipe(csv())
  .on('data', (row) => {
      if (unsynced.find(row)) {
        // Write an updated row

      }
      else {
        // Write the same row

      }
  })
  .on('end', () => {
    console.log('CSV file parsed successfully.');
  });
  
}

// I'm just going to build up an array instead
function get_unsynced_entries(path) {
  let unsynced = [];

  // Part of the problem is that its not pushing to unsynced properly
  // Part of the problem is that its not recognizing when something is unsynced

  const lambda = (row) => {
    console.log(row);

    const unsync = (LAST_SYNC === null) || (moment(row.last_updated) > (LAST_SYNC));
    console.log('unsynced? '+unsync+' last sync was: '+LAST_SYNC);

    if (unsync) { //If the data is unsynced by timestamp
      unsynced.push(row);
    }
}

  fs.createReadStream(path)
  .pipe(csv())
  .on('data', lambda)
  .on('end', () => {
    console.log('CSV file parsed successfully.');
  });

  console.log('logging unsynced array: '+unsynced);
  return unsynced;
}

// Testing, mimic server request, output to console
// expect 6 new entires per pring
const timer = 15*1000;
setInterval(() => {
  console.log (" ____ ");
  get_unsynced_entries('./data/water.csv');
  LAST_SYNC = moment();
}, 
timer);



// For now, I'm going to go back to assuming there is only one .csv file!

// const currentDirectory = process.cwd();
// // Read every file in the directory mounted to data
// // At this point CWD is /app, why?
// fs.readdir('./data', (err, files) => {
  
//   if (err) {

//     console.error('Error reading directory:', err);
//     return;
//   }

//   // Iterate through each file
//   files.forEach(file => {
//     const filePath = currentDirectory+'/data/'+file;
//     read_file(filePath);
//   });
// });



