import fs from "fs";
import FormData from "form-data"
import moment from "moment"
import  * as f from "../util/functions.js"
import fetch from "node-fetch"

import pg from "pg"

// Generates random data and writes it to a postgres instance on a timer

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;
const og = "e-srv"+process.env.EDGE_ID;
const TIMER = 5000;
const E_URL = "http://e-srv:3000";

function call_local_write_endpoint_on_edge(filename) {

    // Client will read files out of mock-client-data and local write them to data through the e-srv API

    // const file = fs.createReadStream(`mock-client-data/${process.env.TEST_FILE}`);
    // const filename = process.env.TEST_FILE;
    const file = fs.createReadStream(`mock-client-data/${filename}`);
    const formData = new FormData();

    formData.append('filename', filename);
    formData.append('file', file); //Automatically deals with size

    f.HOFetch(`http://${og}:${EXPRESS_PORT}/local-write`, 
    {
        method: 'POST',
        headers: {
        },
        body: formData
    },
    (res) => {
        console.log(res.message);
    });
}

function call_cloud_write_endpoint_on_edge(filename) {

    // Client will read files out of mock-client-data and local write them to data through the e-srv API

    // const file = fs.createReadStream(`mock-client-data/${process.env.TEST_FILE}`);
    // const filename = process.env.TEST_FILE;

    const file = fs.createReadStream(`mock-client-data/${filename}`);
    // const filename = process.env.TEST_FILE;

    const formData = new FormData();

    formData.append('filename', filename);
    formData.append('file', file); //Automatically deals with size

    f.HOFetch(`http://${og}:${EXPRESS_PORT}/cloud-write`, 
    {
        method: 'POST',
        headers: {
        },
        body: formData
    },
    (res) => {
        console.log(res.message);
    });
}

function call_local_read_endpoint_on_edge() {
    console.log('Reading local');

    fetch(`http://${og}:${EXPRESS_PORT}/local-read`, {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "user": process.env.USERNAME,
            "files": [process.env.TEST_FILE],
            "condition": 0.186
        })
    })
    .then(res=> res.json() )
    .then((response)=>{
        // Not sure why you need to stringify it when it comes from the cloud, but this is chillin
        console.log(response.query_results);
    })
    .catch((error)=>console.error("Error",error));

    // WHEN you put a lambda in brackets, it needs to have a return statement
    // res => {res.json()} doesn't return anything, so its undefined
    // res => res,json() or res => {return res.json()} would work
}
// Test: local-write, then local-read by query
// setTimeout(call_local_write_endpoint_on_edge, 6000);
// setTimeout(call_local_read_endpoint_on_edge, 7000);

function call_filesys_read_endpoint_on_cloud() {
    console.log('Reading cloud filesystem');

    // Going to test this with one edge server uploading 2 files then querying these 2 files

    fetch(`http://fs:${EXPRESS_PORT}/filesys-read`, {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "user": process.env.USERNAME,
            "bucket": process.env.LOCAL_GROUP,
            "files":["test/MAC000002.csv","test/MAC000004.csv"],
            "condition": 0.186
        })
    })
    .then(res=> res.json() )
    .then((response)=>{
        // I'm not sure why you need to stringify it when it comes from the cloud
        console.log(JSON.stringify(response.query_results));
    })
    .catch((error)=>console.error("Error",error));
}
// Test, cloud-write 2 files, then cloud-read a query across both of them.
// setTimeout(() => call_cloud_write_endpoint_on_edge('MAC000002.csv'), 6000);
// setTimeout(() => call_cloud_write_endpoint_on_edge('MAC000004.csv'), 6500);
// setTimeout(() => call_filesys_read_endpoint_on_cloud(), 7000);

function call_query_read_endpoint_on_broker() {
    console.log('Reading local and cloud data with hybrid-query');

    fetch(`http://c-srv:${EXPRESS_PORT}/read-query`, {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "user": process.env.USERNAME,
            "query_components": [ 
                {
                    "owner":null,
                    "bucket": "B",
                    "files":["test/MAC000002.csv","test/MAC000004.csv"]
                },
                {
                    "owner":"A",
                     "files":["MAC000003.csv"]
                }
            ],
            "condition": 0.186
        })
    })
    .then(res=>res.json() )
    .then((response)=>{
        console.log(JSON.stringify(response.query_results));
    })
    .catch((error)=>console.error("Error",error));
}
// Test: See diagram on iPad.
// The idea is that we will directly call read-query on broker
// and then that query will join files that A published to the cloud, and a file local to group B
// using u2 in A, B to upload cloud data and call endpoint
// if (process.env.LOCAL_GROUP === "B") {
//     setTimeout(() => call_cloud_write_endpoint_on_edge('MAC000002.csv'), 6000);
//     setTimeout(() => call_cloud_write_endpoint_on_edge('MAC000004.csv'), 6500);
//     setTimeout(() => call_query_read_endpoint_on_broker(), 7000);
// }
// if (process.env.LOCAL_GROUP === "A") {
//     setTimeout(() => call_local_write_endpoint_on_edge('MAC000003.csv'), 6000);
// }


function call_query_read_endpoint_on_broker_test_PE() {
    console.log('Reading local and cloud data with hybrid-query, testing policy engine authentication');

    fetch(`http://c-srv:${EXPRESS_PORT}/read-query`, {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "user": process.env.USERNAME,
            "query_components": [ 
                {
                    "owner":null,
                    "bucket": "B",
                    "files":["test/MAC000002.csv","test/MAC000004.csv"]
                },
                {
                    "owner":"A",
                     "files":["MAC000003.csv"]
                },
                {
                    "owner":"C",
                     "files":["MAC000005.csv"]
                }
            ],
            "condition": 0.186
        })
    })
    .then(res=>res.json() )
    .then((response)=>{
        console.log(JSON.stringify(response.query_results));
    })
    .catch((error)=>console.error("Error",error));
}
// Test: See diagram on iPad.
// Building on the previous test, see if hybrid cloud can return a partially
// completed query. The query component to group C's local machine gets rejected
// because u2 isn't in group C.

if (process.env.LOCAL_GROUP === "B") { //u2
    setTimeout(() => call_cloud_write_endpoint_on_edge('MAC000002.csv'), 6000);
    setTimeout(() => call_cloud_write_endpoint_on_edge('MAC000004.csv'), 6500);
    setTimeout(() => call_query_read_endpoint_on_broker_test_PG(), 7000);
}
if (process.env.LOCAL_GROUP === "A") { //u1
    setTimeout(() => call_local_write_endpoint_on_edge('MAC000003.csv'), 6000);
}
if (process.env.LOCAL_GROUP === "C") { //u3
    setTimeout(() => call_local_write_endpoint_on_edge('MAC000005.csv'), 6000);
}



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
    f.HOFetch(`http://${og}:${EXPRESS_PORT}/query-ingestor`, 
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

//setInterval(() => {generate_rand_row_db()}, TIMER );
