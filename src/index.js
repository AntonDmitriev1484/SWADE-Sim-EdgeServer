import csv from "csv-parser"
import fs from "fs"

// Hostname that our dummy cloud server container will have 
// on docker network 'edge-test'
const HOST = "http://cloud-srv"
const ENDPOINT = ":3000/";
const URL = HOST+ENDPOINT;

const REQ_RATE = 1000;

let post_to_cloud = (row) => {
    fetch(URL, 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(row)
        })
        .then(response => response.json())
        .then(result => {
            console.log('POST request successful');
            console.log(result);
          })
        .catch(error => {
            console.error('Error:', error);
          });
}

// Reading in json files, I'm pretty sure you json.parse
// and then iterate through the object fields (single json row)

// Awwooooga functional for reading in CSV files
fs.createReadStream('./data/color_srgb.csv') // Looks from project working dir
  .pipe(csv())
  .on('data', (row) => {
    // Process each row of the CSV data
    post_to_cloud(row);
    console.log(row);
    
  })
  .on('end', () => {
    // Parsing is completed
    console.log('CSV file parsed successfully.');
  });