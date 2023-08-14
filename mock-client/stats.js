import fs from "fs"
import csv from "csv-parser"

let CLEANED = {
    DATE_MIN: new Date('9999-12-31T23:59:59Z'),
    DATE_MAX : new Date('0000-01-01T00:00:00Z'),
    ENERGY_MIN : Number.MAX_SAFE_INTEGER,
    ENERGY_MAX : 0
}

let UNCLEANED = {
    DATE_MIN: new Date('9999-12-31T23:59:59Z'),
    DATE_MAX : new Date('0000-01-01T00:00:00Z'),
    ENERGY_MIN : Number.MAX_SAFE_INTEGER,
    ENERGY_MAX : 0
}


// Need to find MIN and MAX across clean and uncleaned datasets
async function find_stats(EDGE_TO_MAC_FILES, EDGE_TO_BLOCK_FILES, main_func) {

    // readstream is 100% async add promises
    const cleaned_files = Object.entries(EDGE_TO_MAC_FILES).reduce((acc, [group,files]) => {return acc.concat(files)}, [])
    const uncleaned_files = Object.entries(EDGE_TO_BLOCK_FILES).reduce((acc, [group,files]) => {return acc.concat(files)}, [])
    
    console.log(cleaned_files);
    let promises = cleaned_files.map(
            (file) => {

                return new Promise((resolve, reject) => {
                    const read_stream = fs.createReadStream('mock-client-data/'+file);
                    read_stream.pipe(csv())
                    .on('data', (row) => {
        
                            const tstp = f(row['tstp'], 'tstp')
                            const energy = f(row['energy(kWh/hh)'], 'energy(kWh/hh)')
        
                            if (CLEANED.DATE_MAX < tstp) {
                                CLEANED.DATE_MAX = tstp
                            }
                            if (CLEANED.DATE_MIN > tstp) {
                                CLEANED.DATE_MIN = tstp
                            }
                            if (CLEANED.ENERGY_MAX < energy) {
                                CLEANED.ENERGY_MAX = energy
                            }
                            if (CLEANED.ENERGY_MIN > energy) {
                                CLEANED.ENERGY_MIN = energy
                            }
                    })
                    .on('end', ()=> {
                        resolve();
                    })
                })
                
    
            }
        )


    
        promises.concat (uncleaned_files.map(    
            (file) => {
                console.log(file);
                return new Promise((resolve, reject) => {
                    const read_stream = fs.createReadStream('mock-client-data/'+file);
                    read_stream.pipe(csv())
                    .on('data', (row) => {
        
                        const tstp = f(row['day'], 'day')
                        const energy = f(row['energy_mean'], 'energy_mean')

                        if (UNCLEANED.DATE_MAX < tstp) {
                            UNCLEANED.DATE_MAX = tstp
                        }
                        if (UNCLEANED.DATE_MIN > tstp) {
                            UNCLEANED.DATE_MIN = tstp
                        }
                        if (UNCLEANED.ENERGY_MAX < energy) {
                            UNCLEANED.ENERGY_MAX = energy
                        }
                        if (UNCLEANED.ENERGY_MIN > energy) {
                            UNCLEANED.ENERGY_MIN = energy
                        }
                    })
                    .on('end', ()=> {
                        resolve();
                    })
                })
            }
        ))

    await Promise.all(promises);
    console.log('done');
    //console.log(CLEANED);
    main_func(CLEANED, UNCLEANED);
}






const formatters = {
    'tstp': (value) => { // Will only be used querying MAC files
      //console.log(`String read in row: ${field}`);
      // For NOT MAC02 files
      const dateTimeString = value;
      const [datePart, timePart] = dateTimeString.split(' '); // Split date and time parts
      const [year, month, day] = datePart.split('-').map(Number); // Parse year, month, day
      const [hours, minutes, seconds] = timePart.split(':').map(Number); // Parse hours, minutes, seconds
  
      // Create a new Date object with the parsed values
      const dateTime = new Date(year, month - 1, day, hours, minutes, seconds);
      
      //console.log(`Converted dateTime object: ${dateTime}`);
      return dateTime;
    },
    'day': (value) => { // Will only be used querying Block files 
      // For some reason, even though its written as mm/dd/yyyy it gets parsed as yyyy-mm-dd
      const dateString = value.trim();
      const [year, month, day] = dateString.split('-').map(Number);
      // Create a new Date object with the parsed values
      const dateTime = new Date(year, month - 1, day);
      //console.log(`val ${dateString} -> ${dateTime}`);
      return dateTime;
    },
    'energy(kWh/hh)': (value) => {
      return value.trim();
    },
    'energy_median': (value) => {
      return value.trim();
    },
    'energy_mean': (value) => {
      return value.trim();
    },
    'LCLid': (value) => {
      return value.trim();
    }
  
  }
  
  // Formatter function. Format value by field_name's standard to make it comparable
  function f(value, field_name) {
    if (value === null) {
      return value;
    }
  
    return formatters[field_name](value);
  }


  export default {find_stats}