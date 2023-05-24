// const fs = require('fs');

// // Read the file
// let rawdata = fs.readFileSync('./database/foundationDownload.json');

// // Parse the JSON data
// let database = JSON.parse(rawdata);

// // Process the database
// let foodDatabase = database.FoundationFoods.map(food => food.description);

// console.log(foodDatabase);

const fs = require('fs');
const Papa = require('papaparse');

let csvData = fs.readFileSync('./database/ingredients.csv', 'utf8');

Papa.parse(csvData, {
    complete: function(results) {
        let firstElements = results.data.map(array => array[0]);
        let uniqueElements = [...new Set(firstElements)];
        console.log(uniqueElements);
    }
});
// In this code, new Set(firstElements) creates a new Set from the firstElements array.
// Because a Set only contains unique values, this removes any duplicates from the array.
// The [...new Set(firstElements)] syntax converts the Set back into an array
// (because Sets and arrays have some differences in how they can be used).
// The uniqueElements array contains the same values as firstElements, but with all duplicates removed.

// Papa.parse(csvData, {
//     delimiter: "",	// auto-detect
//     newline: "",	// auto-detect
//     quoteChar: '"',
//     escapeChar: '"',
//     header: false,
//     transformHeader: undefined,
//     dynamicTyping: false,
//     preview: 0,
//     encoding: "",
//     worker: false,
//     comments: false,
//     step: undefined,
//     complete: undefined,  // << A complete callback function that gets executed once the parsing of the CSV data is done
//     error: undefined,
//     download: false,
//     skipEmptyLines: false,
//     chunk: undefined,
//     fastMode: undefined,
//     beforeFirstChunk: undefined,
//     withCredentials: undefined,
//     transform: undefined
// });
// As you can see, complete is one of many options that can be set.
// You can find a complete list of these options and what they do in the Papa Parse documentation.