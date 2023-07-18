// Generates random data and appends it to data/???.csv

// Generate one new row every 5 seconds

const filename = "water.csv"; //???
const path = "../data/"+filename;
const timer = 1000*5; //5s

// Read in the format of one row in the CSV file
function read_format() {

}

const format = read_format();

// Just pop new numbers into this format
function generate_rand_data() {

}



// Write random data once every 5s
setInterval(() => {
        generate_rand_data();
    }, 
timer);
