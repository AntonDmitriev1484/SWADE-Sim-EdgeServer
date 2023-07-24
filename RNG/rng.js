import fs from "fs";
import moment from "moment"
import  * as f from "../util/functions.js"

import pg from "pg"
//import zmq from "zmq"

// Generates random data and writes it to a postgres instance
// Generate one new row every 5 seconds

// on docker swade-net, the database container will be pg

// I think it will ECONNECT REFUSE if this starts running to early before PG

const E_URL = "http://e-srv:3000";

function generate_rand_row_db() {
    const LCLid = 'MAC000002';
    // postgres just didn't feel like making the LCLid col in the table definition
    // so I'm going to drop it for now
    const querystr = `INSERT INTO rand (LCLid, tstp, energy, last_updated, created_on) VALUES (\'${LCLid}\', NOW(), ${Math.random()}, NOW(), NOW());`
    
    // We will assume that all clients pass queries to their database through my software
    // by making API calls to e-srv:
    // So, this random query will be passed through a fetch request to e-srv

    
    f.HOFetch(E_URL+"/ingest-query", 
    {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: 
            JSON.stringify({"query": querystr})
    },
    (res) => {
        console.log(res.message);
    });
    
}



const filename = "water.csv"; //???
const path = "./data/"+filename;
const timer = 1000*5; //5s

setInterval(() => {generate_rand_row_db()}, timer );

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