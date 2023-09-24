/**
 * @param {Integer} pageNum Specifies the number of the page 
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
**/
// let PDF_URL  = './receipt-3333162999.pdf';
let PDF_URL  = null;

document.getElementById("pdfForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    axios.post('http://localhost:3001/uploads', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }).then(response => {
        console.log('File uploaded successfully');
        console.log(response.data);
        PDF_URL = `http://localhost:3001/${response.data.filePath}`;
        fetch('./openfoodfacts.json')
    .then(response => response.json())
    .then(data => {
        databaseIngredients = data.tags.map(tag => tag.name); 
        pdfjsLib.getDocument(PDF_URL).promise.then(function (PDFDocumentInstance) {
            var totalPages = PDFDocumentInstance.numPages;
            var pageNumber = 1;
            // Extract the text
            getPageText(pageNumber, PDFDocumentInstance).then(function(textPage){
                // Clean the text of the page
                cleanText(textPage, databaseIngredients);
                // Use the cleaned text in your application
            });
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
    })
    .catch(error => console.error('Error:', error));
        // processPDF();    
    }).catch(error => {
        console.log('Error uploading file', error);
    })
});



// async function processPDF() {
//     try {
//         const response = await fetch('./openfoodfacts.json');
//         const data = await response.json();
//         const databaseIngredients = data.tags.map(tag => tag.name);

//         const PDFDocumentInstance = await pdfjsLib.getDocument(PDF_URL).promise;
//         const totalPages = PDFDocumentInstance.numPages;
//         const pageNumber = 1;

//         const textPage = await getPageText(pageNumber, PDFDocumentInstance);
//         cleanText(textPage, databaseIngredients);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }



function getPageText(pageNum, PDFDocumentInstance) {
    // Return a Promise that is solved once the text of the page is retrieven
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            // The main trick to obtain the text of the PDF page, use the getTextContent method
            pdfPage.getTextContent().then(function (textContent) {
                var textItems = textContent.items;
                var finalString = "";
                // Concatenate the string of the item to the final string
                for (var i = 0; i < textItems.length; i++) {
                    // console.log(textItems[i])
                    var item = textItems[i];
                    finalString += item.str + " ";
                }
                // Solve promise with the text retrieven from the page
                resolve(finalString);
            });
        });
    });
}

pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.js'; // set path to pdf.worker.js

// pdfjsLib.getDocument(PDF_URL).promise.then(function (PDFDocumentInstance) {
    
    //     var totalPages = PDFDocumentInstance.numPages;
    //     var pageNumber = 1;
    
    //     // Extract the text
    //     getPageText(pageNumber , PDFDocumentInstance).then(function(textPage){
        //         // Show the text of the page in the console
        //         console.log(textPage);
        //     });
        
        // }, function (reason) {
            //     // PDF loading error
            //     console.error(reason);
            // });
            
            
            // https://mozilla.github.io/pdf.js/examples/
            // https://ourcodeworld.com/articles/read/405/how-to-convert-pdf-to-text-extract-text-from-pdf-with-javascript#disqus_thread

let ingredientNames = [];
let adjectiveFoods = ["MUSHROOMS", "CHEESE", "STEAKS", "JUICE", "LEAF", "SAUCE", "NOODLES", "BUTTER", "CREAM", "NUTS", "RICE", "ONIONS", "CRISPS", "YOGHURT"];        
let prefixFoods = ["SALMON", "PORK", "BEEF", "CHICKEN", "PASTA", "CHOCOLATE"];

    

function isFoodItem(item, database) {
    const lowerItem = item.toLowerCase();
    return database.some(dbItem => dbItem.toLowerCase() === lowerItem);
}

// This will convert item and each dbItem in database to lowercase before checking for inclusion.
// Note that I used Array.prototype.some() instead of Array.prototype.includes() because some allows you to specify a function to test each element,
// giving you the ability to control the case of the strings you're comparing.
// basically I am going to have a variable that will be something like fridgeCupboardFreezerOrNone, this will start off with a value of null
// when I am iterating through splitPdfText down there, I will make the variable change to fridge, when this word is encountered during the iteration
// then change to cupboard when encountering cupboard etc. 
// I then need to make this a property of an object, along with name and date
function cleanText(pdfText, openFoodDatabase) {
    let storageLocation = "";
    let finalIngredients = [];
    let splitPdfText = pdfText.split(' ');
    let items = [];
    let blockedItems = new Set();

    let fridgeRegex = /Fridge/;
    let cupboardRegex = /Cupboard/;
    let freezerRegex = /Freezer/;
    let pluralEs = /(ES|S)$/;
    let pluralS = /S$/;
    let capitalRegex = /^[A-Z]+$/
    // Check if there are ingredients in the PDF that need to be added with more context - e.g. "chicken + thighs"
    // If there are, add them as a pair, and then add them to blockedItems so that when we cross reference the database later so they are not added twice
    // for (var i = 0; i < splitPdfText.length; i++) {
    //     let splitPdfTextWord = splitPdfText[i];
    //     if(fridgeRegex.match(splitPdfTextWord)){
    //         fridgeCupboardFreezerOrNone = "Fridge";
    //     }
    //     if(cupboardRegex.match(splitPdfTextWord)){
    //         fridgeCupboardFreezerOrNone = "Cupboard";
    //     }
    //     if(freezerRegex.match(splitPdfTextWord)){
    //         fridgeCupboardFreezerOrNone = "Freezer";
    //     }
    //     if(adjectiveFoods.includes(splitPdfTextWord)){
    //         addItemIfUnique(finalIngredients, splitPdfText[i - 1] + " " + splitPdfText[i]);
    //         blockedItems.add(splitPdfText[i]);
    //         blockedItems.add(splitPdfText[i - 1]);
    //         blockedItems.add(splitPdfText[i - 1] + " " + splitPdfText[i]);
    //         continue;
    //     }
    //     if(prefixFoods.includes(splitPdfTextWord)){
    //         addItemIfUnique(finalIngredients, splitPdfText[i] + " " + splitPdfText[i + 1]);
    //         blockedItems.add(splitPdfText[i]);
    //         blockedItems.add(splitPdfText[i + 1]);
    //         blockedItems.add(splitPdfText[i] + " " + splitPdfText[i + 1]);
    //     }
    //     items.push({itemName: splitPdfTextWord, location: fridgeCupboardFreezerOrNone}); // add all words from the pdf to items
    // }
    let index = 0;
    for (let word of splitPdfText) {
        if(fridgeRegex.test(word)) storageLocation = "Fridge";
        if(cupboardRegex.test(word)) storageLocation = "Cupboard";
        if(freezerRegex.test(word)) storageLocation = "Freezer";
        
        // Consider changing adjectiveFoods and prefixFoods to Set for better performance in includes method.
        if(adjectiveFoods.includes(word)){
            const combinedWord = `${splitPdfText[index - 1]} ${word}`;
            finalIngredients.push({name: combinedWord, location: storageLocation});
            blockedItems.add(combinedWord);
        }
        
        if(prefixFoods.includes(word)){
            const combinedWord = `${word} ${splitPdfText[index + 1]}`;
            finalIngredients.push({name: combinedWord, location: storageLocation});
            blockedItems.add(combinedWord);
        }
        index++;
    }
    for (const word of splitPdfText){ // go through pdf words again
        if(blockedItems.has(word)) continue;
        if(!capitalRegex.test(word)) continue;
        if (isFoodItem(word, openFoodDatabase)){ // if the word is in the data base, and is not in blocked items
                finalIngredients.push({name: word, location: storageLocation}) // add it to final data set 
                blockedItems.add(word) // when it is added to the data set, add it to the blocked items also
            
        }
        const singularNoS = pluralS.test(word) ? word.slice(0, -1) : word; // if the item is plural (ends with s)? Remove the s 
        if (isFoodItem(singularNoS, openFoodDatabase) && !blockedItems.has(word)){ // check this new item against the openfood database
            if(capitalRegex.test(word)){
                finalIngredients.push({name: word, location: storageLocation}) // add it to the final data set 
                blockedItems.add(word)
            }
        }
        const match = word.match(pluralEs);
        const singularNoEs = match ? word.slice(0, -match[0].length) : word; // do the same with es 
        if (isFoodItem(singularNoEs, openFoodDatabase) && !blockedItems.has(word)){
            if(capitalRegex.test(word)){
                finalIngredients.push({name: word, location: storageLocation})
                blockedItems.add(word)
            }
        }
    }
    console.log(finalIngredients)
    let ingredientsObjectArray = finalIngredients.map(ingredient => {
            return {
            name: ingredient,
        }
    });
    console.log(ingredientsObjectArray)
    makeStuffFromIngredientsArray(ingredientsObjectArray)
    return ingredientsObjectArray;
    
};

const ingredientsDOM = document.querySelector('.ingredientsList');
const submitButton = document.querySelector('submit-btn');

function makeStuffFromIngredientsArray(ingredientsObjectArray){
    const allIngredients = ingredientsObjectArray.map((ingredient, index) => {
        console.log(ingredient)
        return `<label><input type="checkbox" name="ingredient${index}" value="${ingredient.name}">${ingredient.name}</label><br>`
    }).join('');
    ingredientsDOM.innerHTML = allIngredients;
}

// function addItemIfUnique(array, newItem) {
//     if (!array.includes(newItem)) {
//         array.push(newItem);
//     }
// };

document.getElementById("ingredientsForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const selectedIngredients = [];

    // Loop through formData to get selected (checked) ingredients
    for (let [key, value] of formData) {
        selectedIngredients.push(value);
    }

    // Now, you can send selectedIngredients to MongoDB
    // And then get that data from Mongo
    try {
        await axios.post('/api/v1/ingredients', { ingredients: selectedIngredients });
        await axios.get('/api/v1/notion');
        // Success handling
    } catch (error) {
        // Error handling
    }
});


// I need to make finalIngredients an array of ingredient objects







// /**
//  * Retrieves the text of a specif page within a PDF Document obtained through pdf.js 
//  * 
//  * @param {Integer} pageNum Specifies the number of the page 
//  * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
//  **/
// function getPageText(pageNum, PDFDocumentInstance) {
//     // Return a Promise that is solved once the text of the page is retrieven
//     return new Promise(function (resolve, reject) {
//         PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
//             // The main trick to obtain the text of the PDF page, use the getTextContent method
//             pdfPage.getTextContent().then(function (textContent) {
//                 var textItems = textContent.items;
//                 var finalString = "";
//                 // Concatenate the string of the item to the final string
//                 for (var i = 0; i < textItems.length; i++) {
//                     var item = textItems[i];
//                     finalString += item.str + " ";
//                 }
//                 // Solve promise with the text retrieven from the page
//                 resolve(finalString);
//             });
//         });
//     });
// }

// var PDF_URL  = 'assets/receipt-3333162999.pdf';

// pdfjsLib.getDocument(PDF_URL).then(function (PDFDocumentInstance) {
    
//     var totalPages = PDFDocumentInstance.numPages;
//     var pageNumber = 1;

//     // Extract the text
//     getPageText(pageNumber , PDFDocumentInstance).then(function(textPage){
//         // Show the text of the page in the console
//         console.log(textPage);
//     });

// }, function (reason) {
//     // PDF loading error
//     console.error(reason);
// });

// // let PDFJS = require('pdfjs-dist');


// // // Our Code World
// // // Path to PDF file
// // var PDF_URL = '/path/to/example.pdf';
// // // Specify the path to the worker
// // PDFJS.workerSrc = '/path/to/pdf.worker.js';

// // // Proceed to import the PDF that you want to convert into text using the getDocument method of PDFJS 
// // // (exposed globally once the pdf.js script is loaded in the document).

// // var PDF_URL  = '/path/to/example.pdf';

// // PDFJS.getDocument(PDF_URL).then(function (PDFDocumentInstance) { 
// // // Use the PDFDocumentInstance To extract the text later
// // }, function (reason) {
// //     // PDF loading error
// //     console.error(reason);
// // });
// // The PDFDocumentInstance is an object that contains useful methods that we are going to use to extract the text from the PDF.
// // The PDFDocumentInstance object retrieven from the getDocument method (previous step) allows you to explore the PDF through an useful method, namely getPage. This method expects as first argument the number of the page of the PDF that should be processed, then it returns (when the promise is fulfilled) as a variable the pdfPage. From the pdfPage, to achieve our goal of extracting the text from a PDF, we are going to rely on the getTextContent method. The getTextContent method of a pdf page is a promise based method that returns an object with 2 properties:
// // items: Array[X]
// // styles: Object
// // We are insterested in the objects stored in the items array. This array contains multiple objects (or just one according to the content of the PDF) 