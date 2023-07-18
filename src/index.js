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

// Listens for a sync request from the cloud server
app.get('/sync', (req, res) => {
  // Find all data that is not syncd to the cloud
  // Send that data to c-srv in res\
  const filename = "water.csv"; //???
  const path = "../data/"+filename;
  let unsynced = get_unsynced_entries(path);

});

function get_unsynced_entries(path) {
  let unsynced = [];

  fs.createReadStream(path)
  .pipe(csv())
  .on('data', (row) => {
      console.log(row);
      if (true) { //If the data is unsynced by timestamp
        unsynced.push(row);
      }
  })
  .on('end', () => {
    console.log('CSV file parsed successfully.');
  });

  return unsynced;
}



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



