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
  // Find all data that is not syncd to the cloud in water.csv
  // Send that data to c-srv in res
  const filename = "water.csv";
  const path = "./data/"+filename;

  const send_result = (unsynced) => {
    res.send(unsynced);
  }

  apply_to_unsynced_entries(path, send_result);

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

// Yeah its just not making it in here
console.log('In server script');
//Note: I think this server is just not starting for some reason
app.listen(3000, () => {console.log('listen 3000')});

// Testing, mimic server request, output to console
// expect 3 new entires per ping
// const timer = 15*1000;
// setInterval(() => {
//   console.log (" ____ ");

//   apply_to_unsynced_entries('./data/water.csv', 
//     (unsynced) => {
//       if (LAST_SYNC !== null) {
//         console.log(LAST_SYNC.toISOString());
//       }
//       else {
//         console.log("LAST_SYNC is null");
//       }
//       console.log(unsynced);
//       LAST_SYNC = moment();
//     });

// }, 
// timer);



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



// Don't need to keep individual timestamps on each entry as of right now
// assume that when we sync, all data gets synced.
// function update_timestamps(unsynced) {
//   // Options for updating
//   // 1. Read CSV file into big array that lives in the script, perform all R/W there
//   // 2. Keep track of rows that need to be changed, copy/re-write the file in a second pass

//   fs.createReadStream(path)
//   .pipe(csv())
//   .on('data', (row) => {
//       if (unsynced.find(row)) {
//         // Write an updated row

//       }
//       else {
//         // Write the same row

//       }
//   })
//   .on('end', () => {
//     console.log('CSV file parsed successfully.');
//   });
  
// }



