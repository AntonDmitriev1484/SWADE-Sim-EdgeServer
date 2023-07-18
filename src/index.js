import csv from "csv-parser"
import fs from "fs"
import express from "express"

const app = express();
app.use(express.json());

// Hostname that our dummy cloud server container will have 
// on docker network 'edge-test'
const HOST = "http://c-srv"
const ENDPOINT = ":3000/";
const URL = HOST+ENDPOINT;
let CSV_ARR = [];

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

  fs.createReadStream(path)
  .pipe(csv())
  .on('data', (row) => {
      console.log(row);

      const unsync = (row.last_sync === "never") || (moment(row.last_updated) > moment(row.last_sync));

      if (unsync) { //If the data is unsynced by timestamp
        unsynced.push(row);
      }
  })
  .on('end', () => {
    console.log('CSV file parsed successfully.');
  });

  return unsynced;
}

// Testing, mimic server request, output to console
// expect 6 new entires per pring
const timer = 30*1000;
setInterval(() => {
  console.log (" ____ ");
  console.log(get_unsynced_entries('./data/water.csv'));
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



