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