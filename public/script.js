fetch('database/openfoodfacts.json')
    .then(response => response.json())
    .then(data => {
        const ingredientNames = data.tags.map(tag => tag.name); 
        console.log(ingredientNames) // Now data is a JavaScript object representing the JSON
    })
    .catch(error => console.error('Error:', error));

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

var PDF_URL  = 'assets/receipt-3333162999.pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'public/pdf.worker.js'; // set path to pdf.worker.js

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



function cleanText(rawText) {
    var lines = rawText.split(' ');
    var items = [];
    // var pricePattern = /^\d+\.\d+/; 
    // regex for a number with a decimal point
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Check if the line is preceded by a price
        items.push(line);
    }
    return items;
}

pdfjsLib.getDocument(PDF_URL).promise.then(function (PDFDocumentInstance) {
    
    var totalPages = PDFDocumentInstance.numPages;
    var pageNumber = 1;

    // Extract the text
    getPageText(pageNumber, PDFDocumentInstance).then(function(textPage){
        // Clean the text of the page
        var splitText = cleanText(textPage);
        // Use the cleaned text in your application
        console.log(splitText);
    });

}, function (reason) {
    // PDF loading error
    console.error(reason);
});






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