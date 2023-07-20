
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

// Testing, mimic server request, output to console
// expect 3 new entires per ping
 const timer = 15*1000;
setInterval(() => {
  console.log (" ____ ");

  apply_to_unsynced_entries('./data/water.csv', 
    (unsynced) => {
      if (LAST_SYNC !== null) {
        console.log(LAST_SYNC.toISOString());
      }
      else {
        console.log("LAST_SYNC is null");
      }
      console.log(unsynced);
      LAST_SYNC = moment();
    });

}, 
timer);



// For now, I'm going to go back to assuming there is only one .csv file!

// const currentDirectory = process.cwd();
// // Read every file in the directory mounted to data
// // At this point CWD is /app, why?
// fs.readdir('./data', (err, files) => {
  
//   if (err) {

//     console.error('Error reading directory:', err);
//     return;
//   }

//   // Iterate through each file
//   files.forEach(file => {
//     const filePath = currentDirectory+'/data/'+file;
//     read_file(filePath);
//   });
// });



// Don't need to keep individual timestamps on each entry as of right now
// assume that when we sync, all data gets synced.
function update_timestamps(unsynced) {
  // Options for updating
  // 1. Read CSV file into big array that lives in the script, perform all R/W there
  // 2. Keep track of rows that need to be changed, copy/re-write the file in a second pass

  fs.createReadStream(path)
  .pipe(csv())
  .on('data', (row) => {
      if (unsynced.find(row)) {
        // Write an updated row

      }
      else {
        // Write the same row

      }
  })
  .on('end', () => {
    console.log('CSV file parsed successfully.');
  });
  
}



