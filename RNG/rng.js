import fs from "fs";
import moment from "moment"
import  * as f from "../util/functions.js"

import pg from "pg"

// Generates random data and writes it to a postgres instance on a timer

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;


const TIMER = 5000;
const E_URL = "http://e-srv:3000";

function generate_rand_row_db() {
    const LCLid = 'MAC000002';
    // postgres just didn't feel like making the LCLid col in the table definition
    // so I'm going to drop it for now
    const og = "e-srv"+process.env.EDGE_ID;
    const querystr = `INSERT INTO rand (origin, LCLid, tstp, energy, last_updated, created_on) VALUES ('${og}','${LCLid}', NOW(), ${Math.random()}, NOW(), NOW());`

    // We will assume that all clients pass queries to their database through my software
    // by making API calls to e-srv:
    // So, this random query will be passed through a fetch request to e-srv
    // Now this is giving a silly little DNS error
    f.HOFetch("http://e-srv:"+EXPRESS_PORT+"/query-ingestor", 
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

setInterval(() => {generate_rand_row_db()}, TIMER );
