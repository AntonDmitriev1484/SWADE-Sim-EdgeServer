import fs from "fs";
import moment from "moment"

import pg from "pg"
import zmq from "zmq"

// Generates random data and writes it to a postgres instance
// Generate one new row every 5 seconds

// on docker swade-net, the database container will be pg
const client = new Client({
    host: 'pg',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'pass',
  })

const filename = "water.csv"; //???
const path = "./data/"+filename;
const timer = 1000*5; //5s

// Just pop new numbers into this format
function generate_rand_row() {

    let rand_data = [];

    for (let i = 0; i < 3; i++) {
        rand_data[i] = Math.floor(100*Math.random())*100
    }

    let row_data = rand_data.concat( [moment().toISOString()]);
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

// Write random data once every 5s
setInterval(() => {
        generate_rand_row();
    }, 
timer);