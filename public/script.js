/**
 * @param {Integer} pageNum Specifies the number of the page 
 * @param {PDFDocument} PDFDocumentInstance The PDF document obtained 
**/

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

let ingredientNames = [];
let adjectiveFoods = ["MUSHROOMS", "CHEESE", "STEAKS", "JUICE", "LEAF", "SAUCE", "NOODLES", "BUTTER", "CREAM", "NUTS", "RICE", "ONIONS", "CRISPS", "YOGHURT"];        
let prefixFoods = ["SALMON", "PORK", "BEEF", "CHICKEN", "PASTA", "CHOCOLATE"];

    
function isFoodItem(item, database) {
    const lowerItem = item.toLowerCase();
    return database.some(dbItem => dbItem.toLowerCase() === lowerItem);
}

function cleanText(pdfText, openFoodDatabase) {
    let storageLocation = "";
    let wordObjectArray = [];
    let finalIngredients = [];
    let splitPdfText = pdfText.split(' ');
    let blockedItems = new Set();

    let fridgeRegex = /Fridge/;
    let cupboardRegex = /Cupboard/;
    let freezerRegex = /Freezer/;
    let missingRegex = /Missing/;
    let pluralEs = /(ES|S)$/;
    let pluralS = /S$/;
    let capitalRegex = /^[A-Z]+$/

    for (let word of splitPdfText) {
        // console.log("🚀 ~ file: script.js:93 ~ cleanText ~ word:", word)
        if(fridgeRegex.test(word)) storageLocation = "Fridge";
        if(cupboardRegex.test(word)) storageLocation = "Cupboard";
        if(freezerRegex.test(word)) storageLocation = "Freezer";
        if(missingRegex.test(word)) storageLocation = "Missing";
        wordObjectArray.push({
            name: word,
            location: storageLocation
        });
    }
    for (let i = 0; i < wordObjectArray.length; i++) { // go through pdf words again
        const wordObject = wordObjectArray[i];
        const word = wordObject.name;

        if(blockedItems.has(word)) continue;

        if(adjectiveFoods.includes(word)){
            const combinedName = `${wordObjectArray[i - 1].name} ${word}`;
            finalIngredients.push({name: combinedName, location: wordObject.location});
            // blockedItems.add(word);
            blockedItems.add(wordObjectArray[i - 1].name);
        } else if(prefixFoods.includes(word)){
            const combinedName = `${word} ${wordObjectArray[i + 1].name}`;
            finalIngredients.push({name: combinedName, location: wordObject.location});
            // blockedItems.add(word);
            // blockedItems.add(wordObjectArray[i + 1].name);
        } else if (isFoodItem(word, openFoodDatabase) && capitalRegex.test(word)){ // if the word is in the data base, and is not in blocked items
                finalIngredients.push({name: word, location: wordObject.location}) // add it to final data set 
                // blockedItems.add(word) // when it is added to the data set, add it to the blocked items also 
        } else {
        const singularNoS = pluralS.test(word) ? word.slice(0, -1) : word; // if the item is plural (ends with s)? Remove the s 
        if (isFoodItem(singularNoS, openFoodDatabase) && !blockedItems.has(word) && capitalRegex.test(word)){ // check this new item against the openfood database
            if(capitalRegex.test(word)){
                finalIngredients.push(wordObject) // add it to the final data set 
                blockedItems.add(word)
            }
        }
        const match = word.match(pluralEs);
        const singularNoEs = match ? word.slice(0, -match[0].length) : word; // do the same with es 
        if (isFoodItem(singularNoEs, openFoodDatabase) && !blockedItems.has(word) && capitalRegex.test(word)){
            if(capitalRegex.test(word)){
                finalIngredients.push(wordObject)
                blockedItems.add(word)
            }
        }
    }
   
    }
    console.log("hey this is a meeee", finalIngredients);

    // let ingredientsObjectArray = finalIngredients.map(ingredient => {
    //         return {
    //         name: ingredient,
    //     }
    // });
    // console.log(ingredientsObjectArray)
    makeStuffFromIngredientsArray(finalIngredients)
    return finalIngredients;
    
};

function removeRedundencies(finalIngredients) {
    for(let i= 0; i < finalIngredients.length - 1; i++){
        const nextNameWords = finalIngredients[i + 1].name.split(' ')
        if(nextNameWords.includes(finalIngredients[i].name)){
            finalIngredients.splice(i, 1)
        }
    }
    return finalIngredients;
};

const ingredientsDOM = document.querySelector('.ingredientsList');
const submitButton = document.querySelector('submit-btn');

function makeStuffFromIngredientsArray(finalIngredients){
    removeRedundencies(finalIngredients);
    const allIngredients = finalIngredients.map((ingredient, index) => {
        console.log(ingredient)
        return `<label><input type="checkbox" name="ingredient${index}" value="${ingredient.name}">${ingredient.name}</label><br>`
    }).join('');
    ingredientsDOM.innerHTML = allIngredients;
}

document.getElementById("ingredientsForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const selectedIngredients = [];

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