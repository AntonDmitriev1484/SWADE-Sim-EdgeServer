import fs from "fs";
import FormData from "form-data"
import  * as f from "../util/functions.js"
import fetch from "node-fetch"

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;
const og = "e-srv"+process.env.EDGE_ID;
const TIMER = 5000;
const E_URL = "http://e-srv:3000";

const INIT_TIME = 7000;

const EXP = {
    CLEANED_DATA: true,
    EDGE_SERVERS: 5,
    FILES_PER_EDGE: 4,
    FILES_SYNC_EDGE: 2,
    MAC_START: 3,
    BLOCK_START: 1,
}

const EDGE_TO_FILE_RANGE = {
    'A': 0,
    'B':1,
    'C':2,
    'D':3,
    'E':4
}

const EDGE_TO_MAC_FILES = {
    'A': ['MAC000003.csv','MAC000004.csv','MAC000005.csv','MAC000006.csv'],
    'B': ['MAC000007.csv','MAC000008.csv','MAC000009.csv','MAC000010.csv'],
    'C': ['MAC000011.csv','MAC000012.csv','MAC000013.csv','MAC000014.csv'],
    'D': ['MAC000015.csv','MAC000016.csv','MAC000017.csv','MAC000018.csv'],
    'E': ['MAC000019.csv','MAC000020.csv','MAC000021.csv','MAC000022.csv']
}

const EDGE_TO_BLOCK_FILES = {
    'A': ['block_1.csv', 'block_2.csv', 'block_3.csv', 'block_4.csv'],
    'B': ['block_5.csv', 'block_6.csv', 'block_7.csv', 'block_8.csv'],
    'C': ['block_9.csv', 'block_10.csv', 'block_11.csv', 'block_12.csv'],
    'D': ['block_13.csv', 'block_14.csv', 'block_15.csv', 'block_16.csv'],
    'E': ['block_17.csv', 'block_18.csv', 'block_19.csv', 'block_20.csv'],
}

// Can determine a range of files to draw from, at the moment, my brain is cheese
// so I'm just oging to hard code verything
//const MAC_FILE_RANGE = (EXP.MAC_START, (EDGE_TO_FILE_RANGE[process.env.LOCAL_GROUP]*4) + 4)


const EDGE_TO_FILES = EXP.CLEANED_DATA ? EDGE_TO_MAC_FILES : EDGE_TO_BLOCK_FILES;


    EDGE_TO_FILES[process.env.LOCAL_GROUP].forEach((file, i) => {
        if (i%2===0) { // Half files go to cloud
            setTimeout(()=> call_cloud_write_endpoint_on_edge(file), INIT_TIME+(200*i));
        }
        else { // Half files are local
            setTimeout(()=> call_local_write_endpoint_on_edge(file), INIT_TIME+(200*i));
        }
    })


if (process.env.LOCAL_GROUP === 'A') {
    // Group A's u1 will be performing all queries

    // Create a component for every file belonging to every org in the system,
    // reduce them all into the same list of components
    const query_components = Object.entries(EDGE_TO_FILES).reduce( (query_components, [group, files]) => {
        let read_files_from_cloud = [];
        let read_files_from_local = [];
        files.forEach( (file, i) => {
            if (i%2===0) { // Same half files read from cloud
               read_files_from_cloud.push(file)
            }
            else { // Same half files are local
                read_files_from_local.push(file)
            }
        })

        query_components.push({
            "owner": null,
            "bucket": group,
            "from_files": read_files_from_cloud
        })

        query_components.push({
            "owner":group,
            "from_files":read_files_from_local
        })
        return query_components;
    }, [])
    console.log(' Total query components: \n')
    console.log( query_components);

    // if (EXP.CLEANED_DATA) {
    //     Q1_MAC(query_components);
    // }
    // else {
    //     Q1_BLOCK(query_components);
    // }
        
}







function call_local_write_endpoint_on_edge(filename) {

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

    // Endpoint on edge automatically sets up bucket and filepath

    const file = fs.createReadStream(`mock-client-data/${filename}`);

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

// [ 
//     {
//         "owner":null,
//         "bucket": "B",
//         "from_files":["test/MAC000004.csv"]
//     },
//     {
//         "owner":"A",
//          "from_files":["MAC000003.csv"]
//     },
//     {
//         "owner":"C",
//          "from_files":["MAC000005.csv"]
//     }
// ]

// Make sure that undefined is working properly as inf!!!

// Dynamically generate query_components and pass them in
function Q1_MAC(query_components) {
    console.log('Reading local and cloud data with hybrid-query, testing policy engine authentication');

    fetch(`http://c-srv:${EXPRESS_PORT}/read-query`, {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "user": process.env.USERNAME,
            "select_fields": ['tstp', 'energy(kWh/hh)', 'LCLid'],
            "query_components": query_components,
            "where": [
                { field: 'tstp', range: ['2013-01-01 00:00:00', '2013-02-01 00:00:00']},
                { field: 'energy(kWh/hh)', range: ['0.120', undefined]}
            ]
            
        })
    })
    .then(res=>res.json() )
    .then((response)=>{
        console.log(JSON.stringify(response.query_results));
    })
    .catch((error)=>console.error("Error",error));
}

function Q1_BLOCK(query_components) {

}

function Q2_MAC(query_components) {
    console.log('Reading local and cloud data with hybrid-query, testing policy engine authentication');

    fetch(`http://c-srv:${EXPRESS_PORT}/read-query`, {
        method: 'POST',
        headers: {
            "accept": "application/json",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "user": process.env.USERNAME,
            "select_fields": ['tstp', 'energy(kWh/hh)', 'LCLid'],
            "query_components": query_components,
            "where": [
                { field: 'energy(kWh/hh)', range: ['0.120', undefined]}
            ]
            
        })
    })
    .then(res=>res.json() )
    .then((response)=>{
        console.log(JSON.stringify(response.query_results));
    })
    .catch((error)=>console.error("Error",error));
}