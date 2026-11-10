let pdfUrl = null;
let databaseIngredients = [];

const ingredientsDOM = document.querySelector('.ingredientsList');
const adjectiveFoods = [
    'MUSHROOMS', 'CHEESE', 'STEAKS', 'JUICE', 'LEAF', 'SAUCE', 'NOODLES',
    'BUTTER', 'CREAM', 'NUTS', 'RICE', 'ONIONS', 'CRISPS', 'YOGHURT', 'OIL', 'PASTA'
];
const prefixFoods = ['SALMON', 'PORK', 'BEEF', 'CHICKEN', 'PASTA', 'CHOCOLATE', 'BAMBOO'];

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

document.getElementById('pdfForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
        const formData = new FormData(event.target);
        const uploadResponse = await axios.post('/uploads', formData);
        pdfUrl = uploadResponse.data.filePath;

        const databaseResponse = await fetch('/openfoodfacts.json');
        if (!databaseResponse.ok) {
            throw new Error('Could not load the ingredient database');
        }

        const database = await databaseResponse.json();
        databaseIngredients = database.tags.map((tag) => tag.name);

        const pdfDocument = await pdfjsLib.getDocument(pdfUrl).promise;
        const firstPageText = await getPageText(1, pdfDocument);
        makeStuffFromIngredientsArray(cleanText(firstPageText, databaseIngredients));
    } catch (error) {
        console.error('Could not process the receipt', error);
    }
});

function getPageText(pageNum, pdfDocument) {
    return pdfDocument.getPage(pageNum).then((pdfPage) =>
        pdfPage.getTextContent().then((textContent) =>
            textContent.items.map((item) => item.str).join(' ')
        )
    );
}

function isFoodItem(item, database) {
    const lowerItem = item.toLowerCase();
    return database.some((databaseItem) => databaseItem.toLowerCase() === lowerItem);
}

function cleanText(pdfText, openFoodDatabase) {
    let storageLocation = 'Missing';
    const wordObjectArray = [];
    const finalIngredients = [];
    const blockedItems = new Set();
    const splitPdfText = pdfText.split(' ');

    const fridgeRegex = /Fridge/;
    const cupboardRegex = /Cupboard/;
    const freezerRegex = /Freezer/;
    const missingRegex = /Missing/;
    const pluralEs = /(ES|S)$/;
    const pluralS = /S$/;
    const capitalRegex = /^[A-Z]+$/;

    for (const word of splitPdfText) {
        if (fridgeRegex.test(word)) storageLocation = 'Fridge';
        if (cupboardRegex.test(word)) storageLocation = 'Cupboard';
        if (freezerRegex.test(word)) storageLocation = 'Frozen';
        if (missingRegex.test(word)) storageLocation = 'Missing';
        wordObjectArray.push({ name: word, location: storageLocation });
    }

    for (let index = 0; index < wordObjectArray.length; index += 1) {
        const wordObject = wordObjectArray[index];
        const word = wordObject.name;
        const previous = wordObjectArray[index - 1];
        const next = wordObjectArray[index + 1];

        if (blockedItems.has(word)) continue;

        if (adjectiveFoods.includes(word) && previous) {
            finalIngredients.push({
                name: `${previous.name} ${word}`,
                location: wordObject.location
            });
            blockedItems.add(previous.name);
        } else if (prefixFoods.includes(word) && next) {
            finalIngredients.push({
                name: `${word} ${next.name}`,
                location: wordObject.location
            });
        } else if (isFoodItem(word, openFoodDatabase) && capitalRegex.test(word)) {
            finalIngredients.push(wordObject);
            blockedItems.add(word);
        } else {
            const singularNoS = pluralS.test(word) ? word.slice(0, -1) : word;
            const singularNoEs = word.match(pluralEs) ? word.replace(pluralEs, '') : word;

            if (isFoodItem(singularNoS, openFoodDatabase) && capitalRegex.test(word)) {
                finalIngredients.push(wordObject);
                blockedItems.add(word);
            } else if (isFoodItem(singularNoEs, openFoodDatabase) && capitalRegex.test(word)) {
                finalIngredients.push(wordObject);
                blockedItems.add(word);
            }
        }
    }

    return removeRedundancies(finalIngredients);
}

function removeRedundancies(ingredients) {
    const seen = new Set();
    return ingredients.filter((ingredient) => {
        const key = `${ingredient.name}|${ingredient.location}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function makeStuffFromIngredientsArray(ingredients) {
    ingredientsDOM.replaceChildren();

    for (const [index, ingredient] of ingredients.entries()) {
        const label = document.createElement('label');
        label.className = 'ingredient-label';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `ingredient${index}`;
        input.value = ingredient.name;
        input.dataset.location = ingredient.location;
        input.className = 'ingredient';

        label.append(input, ` ${ingredient.name}`);
        ingredientsDOM.append(label, document.createElement('br'));
    }
}

document.getElementById('ingredientsForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const selectedIngredients = Array.from(
        document.querySelectorAll('.ingredient:checked')
    ).map((ingredient) => ({
        name: ingredient.value,
        location: ingredient.dataset.location
    }));

    if (selectedIngredients.length === 0) return;

    try {
        await axios.post('/api/v1/ingredients', { ingredients: selectedIngredients });
    } catch (error) {
        console.error('Could not save ingredients', error);
    }
});
