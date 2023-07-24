function count_cols() {
    let csv_cols = 0;

    fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headers) => {
        csv_cols++;
    })
    .on('error', (error) => {
        console.error('Error reading CSV file:', error);
    });

    return csv_cols;
}


// Read in the format of one row in the CSV file
// at present will just return the number of columns the CSV file has
function read_format() {
    let row_headers = [];

    fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headers) => {
        row_headers = headers;
    })
    .on('error', (error) => {
        console.error('Error reading CSV file:', error);
    });

    let size = row_headers.size(); //Find out how many fields there are

}




const filename = "water.csv"; //???
const path = "./data/"+filename;
const cols = ["a", "b", "c", "last_update"];
// For what I'm doing now, last_sync can be a global variable
// It doesn't have to be a field in the row
// as we don't really care about the individual syncing / privacy policy on
// each piece of data.
// rather, we assume everything gets synced on a heartbeat

export function init_file() {
    
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

// Appends to a CSV file of a specific format a, b, c, last_update
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