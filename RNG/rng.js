import fs from "fs";
import moment from "moment"

// Generates random data and appends it to data/???.csv
// Honestly I'm just going to start off with a completely blank file and append to it
// Generate one new row every 5 seconds

const filename = "water.csv"; //???
const path = "./data/"+filename;
const timer = 1000*5; //5s

const cols = ["a", "b", "c", "last_sync", "last_update"];

function init_file() {
    
    // Writes cols to the file
    fs.writeFile(path, cols.join(',')+"\n", 
        (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
            return;
            }
                console.log('CSV file written successfully:', path);
        });
}


// Just pop new numbers into this format
function generate_rand_row() {

    let rand_data = [];

    for (let i = 0; i < 3; i++) {
        rand_data[i] = Math.floor(100*Math.random())*100
    }

    let row_data = rand_data.concat( ['never', moment().toISOString()]);
    let row = row_data.join(',')+'\n';

    fs.appendFile(path, row,
        (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
            return;
            }
                console.log('CSV file written successfully:', path);
        });

}


init_file();
// Write random data once every 5s
setInterval(() => {
        generate_rand_row();
    }, 
timer);


// function count_cols() {
//     let csv_cols = 0;

//     fs.createReadStream(filePath)
//     .pipe(csv())
//     .on('headers', (headers) => {
//         csv_cols++;
//     })
//     .on('error', (error) => {
//         console.error('Error reading CSV file:', error);
//     });

//     return csv_cols;
// }


// Read in the format of one row in the CSV file
// at present will just return the number of columns the CSV file has
// function read_format() {
//     let row_headers = [];

//     fs.createReadStream(filePath)
//     .pipe(csv())
//     .on('headers', (headers) => {
//         row_headers = headers;
//     })
//     .on('error', (error) => {
//         console.error('Error reading CSV file:', error);
//     });

//     let size = row_headers.size(); //Find out how many fields there are

// }
