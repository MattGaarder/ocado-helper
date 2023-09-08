/**
 * @param {Integer} pageNum Specifies the number of the page 
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
**/
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

var PDF_URL  = './receipt-3333162999.pdf';
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
let adjectiveFoods = ["MUSHROOMS", "CHEESE", "STEAKS", "JUICE", "LEAF", "SAUCE", "NOODLES", "BUTTER", "CREAM", "NUTS", "RICE", "ONIONS", "CRISPS", "YOGHURT"]        
let prefixFoods = ["SALMON", "PORK", "BEEF", "CHICKEN", "PASTA", "CHOCOLATE"]

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
    

function isFoodItem(item, database) {
    const lowerItem = item.toLowerCase();
    return database.some(dbItem => dbItem.toLowerCase() === lowerItem);
}

// This will convert item and each dbItem in database to lowercase before checking for inclusion.
// Note that I used Array.prototype.some() instead of Array.prototype.includes() because some allows you to specify a function to test each element,
// giving you the ability to control the case of the strings you're comparing.

function cleanText(pdfText, openFoodDatabase) {
    let finalIngredients = [];
    let splitPdfText = pdfText.split(' ');
    let items = [];
    let blockedItems = new Set();
    let pluralRegex = /(ES|S)$/;
    let pluralRegexTwo = /S$/;
    let capitalRegex = /^[A-Z]+$/
    // Check if there are ingredients in the PDF that need to be added with more context - e.g. "chicken + thighs"
    // If there are, add them as a pair, and then add them to blockedItems so that when we cross reference the database later they are not added twice
    for (var i = 0; i < splitPdfText.length; i++) {
        let splitPdfTextWord = splitPdfText[i];
        if(adjectiveFoods.includes(splitPdfTextWord)){
            addItemIfUnique(finalIngredients, splitPdfText[i - 1] + " " + splitPdfText[i]);
            blockedItems.add(splitPdfText[i]);
            blockedItems.add(splitPdfText[i - 1]);
            blockedItems.add(splitPdfText[i - 1] + " " + splitPdfText[i]);
            continue;
        }
        if(prefixFoods.includes(splitPdfTextWord)){
            addItemIfUnique(finalIngredients, splitPdfText[i] + " " + splitPdfText[i + 1]);
            blockedItems.add(splitPdfText[i]);
            blockedItems.add(splitPdfText[i + 1]);
            blockedItems.add(splitPdfText[i] + " " + splitPdfText[i + 1]);
        }
        items.push(splitPdfTextWord); // add all words from the pdf to items
    }
    for (const item of items){ // go through pdf words again
        if (isFoodItem(item, openFoodDatabase) && !blockedItems.has(item)){ // if the word is in the data base, and is not in blocked items
            if(capitalRegex.test(item)){ // and is not capitalised 
                finalIngredients.push(item) // add it to final data set 
                blockedItems.add(item) // when it is added to the data set, add it to the blocked items also
            }
        }
        const singularItemTwo = pluralRegexTwo.test(item) ? item.slice(0, -1) : item; // if the item is plural (ends with s)? Remove the s 
        if (isFoodItem(singularItemTwo, openFoodDatabase) && !blockedItems.has(item)){ // check this new item against the openfood database
            if(capitalRegex.test(item)){
                finalIngredients.push(item) // add it to the final data set 
                blockedItems.add(item)
            }
        }
        const match = item.match(pluralRegex);
        const singularItem = match ? item.slice(0, -match[0].length) : item; // do the same with es 
        if (isFoodItem(singularItem, openFoodDatabase) && !blockedItems.has(item)){
            if(capitalRegex.test(item)){
                finalIngredients.push(item)
                blockedItems.add(item)
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

function addItemIfUnique(array, newItem) {
    if (!array.includes(newItem)) {
        array.push(newItem);
    }
};

document.getElementById("ingredientsForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const selectedIngredients = [];

    // Loop through formData to get selected (checked) ingredients
    for (let [key, value] of formData) {
        selectedIngredients.push(value);
    }

    // Now, you can send selectedIngredients to MongoDB
    try {
        await axios.post('/api/v1/ingredients', { ingredients: selectedIngredients });
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