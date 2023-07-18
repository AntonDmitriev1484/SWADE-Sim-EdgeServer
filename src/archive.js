
const REQ_RATE = 1000;

function post_to_cloud(row) {
    fetch(URL, 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(row)
        })
        .then(response => response.json())
        .then(result => {
            console.log('POST request successful');
            console.log(result);
          })
        .catch(error => {
            console.error('Error:', error);
          });
}

function read_file(path) {
  fs.createReadStream(path) // Where this will be in the docker directory
  .pipe(csv())
  .on('data', (row) => {
    // Process each row of the CSV data
    post_to_cloud(row);
    console.log(row);
    
  })
  .on('end', () => {
    // Parsing is completed
    console.log('CSV file parsed successfully.');
  });
}

const currentDirectory = process.cwd();
// Read every file in the directory mounted to data
// At this point CWD is /app, why?
fs.readdir('./data', (err, files) => {
  
  if (err) {

    console.error('Error reading directory:', err);
    return;
  }

  // Iterate through each file
  files.forEach(file => {
    const filePath = currentDirectory+'/data/'+file;
    read_file(filePath);
  });
});



