import fs from "fs";
import moment from "moment"

import pg from "pg"
//import zmq from "zmq"

// Generates random data and writes it to a postgres instance
// Generate one new row every 5 seconds

// on docker swade-net, the database container will be pg
const client = new pg.Client({
    host: 'pg',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'pass',
  })


client.connect().then( x => {
        console.log('Client connected to pg');
        // Write random data once every 5s
        setInterval(() => {
            generate_rand_row_db();
        }, 
        timer);
    }
)
.catch( error => {
        console.log('Error connecting client: '+error);
    }
);

function generate_rand_row_db() {
    const LCLid = 'MAC000002';
    // postgres just didn't feel like making the LCLid col in the table definition
    // so I'm going to drop it for now
    const querystr = `INSERT INTO rand (tstp, energy, last_updated, created_on) VALUES (NOW(), ${Math.random()}, NOW(), NOW());`
    
    client.query(querystr)
    .then((res)=> {
        console.log(querystr)
    })
    .catch((error)=> {
        console.log('Error on insert');
        console.log(error);
    }
    )

}

const filename = "water.csv"; //???
const path = "./data/"+filename;
const timer = 1000*5; //5s
// Just pop new numbers into this format
function generate_rand_row_CSV() {

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


//await client.end()