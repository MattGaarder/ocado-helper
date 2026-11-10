const fileInput = document.getElementById('pdfUpload');
const uploadButton = document.getElementById('uploadButton');
const syncButton = document.getElementById('syncButton');
const statusDOM = document.getElementById('status');
const resultsDOM = document.getElementById('results');

const adjectiveFoods = [
    'MUSHROOMS', 'CHEESE', 'STEAKS', 'JUICE', 'LEAF', 'SAUCE', 'NOODLES',
    'BUTTER', 'CREAM', 'NUTS', 'RICE', 'ONIONS', 'CRISPS', 'YOGHURT', 'OIL', 'PASTA'
];
const prefixFoods = ['SALMON', 'PORK', 'BEEF', 'CHICKEN', 'PASTA', 'CHOCOLATE', 'BAMBOO'];

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

// The OpenFoodFacts list is 2.4 MB, so fetch it once and reuse it.
let foodDatabasePromise = null;
function loadFoodDatabase() {
    foodDatabasePromise ??= fetch('/openfoodfacts.json').then((response) => {
        if (!response.ok) throw new Error('Could not load the ingredient database');
        return response.json();
    }).then((database) => database.tags.map((tag) => tag.name));
    foodDatabasePromise.catch(() => { foodDatabasePromise = null; });
    return foodDatabasePromise;
}

function setStatus(message, tone = '') {
    statusDOM.textContent = message;
    statusDOM.dataset.tone = tone;
}

// Disables both buttons while one action runs so uploads and syncs never overlap.
async function runTask(button, task) {
    uploadButton.disabled = true;
    syncButton.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
        await task();
    } catch (error) {
        console.error(error);
        setStatus(error.response?.data?.msg || error.message || 'Something went wrong', 'error');
    } finally {
        uploadButton.disabled = false;
        syncButton.disabled = false;
        button.removeAttribute('aria-busy');
    }
}

function renderResults(ingredients) {
    resultsDOM.replaceChildren(...ingredients.map((ingredient) => {
        const row = document.createElement('li');
        const name = document.createElement('span');
        const tag = document.createElement('span');
        name.textContent = ingredient.name;
        tag.className = 'tag';
        tag.dataset.location = ingredient.location;
        tag.textContent = ingredient.location;
        row.append(name, tag);
        return row;
    }));
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

uploadButton.addEventListener('click', () => fileInput.click());

// Choosing a file runs the whole pipeline: upload, parse, save to MongoDB, write to Notion.
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    runTask(uploadButton, async () => {
        resultsDOM.replaceChildren();
        setStatus(`Reading ${file.name}…`);

        const [fileBuffer, foodNames] = await Promise.all([
            file.arrayBuffer(),
            loadFoodDatabase()
        ]);

        const pdfDocument = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
        const ingredients = cleanText(await getAllText(pdfDocument), foodNames);

        if (ingredients.length === 0) {
            setStatus(`No ingredients found in ${file.name}.`, 'error');
            return;
        }

        setStatus(`Adding ${plural(ingredients.length, 'item')} to Notion…`);
        const { data } = await axios.post('/api/v1/ingredients', { ingredients });

        renderResults(data.ingredients);
        setStatus(`Added ${plural(data.ingredients.length, 'item')} to Notion.`, 'success');
    }).finally(() => {
        // Clear the input so picking the same file again still fires "change".
        fileInput.value = '';
    });
});

syncButton.addEventListener('click', () => {
    runTask(syncButton, async () => {
        setStatus('Syncing with Notion…');
        const { data } = await axios.post('/api/v1/notion/sync');

        resultsDOM.replaceChildren();
        const { created, updated, deleted, notionRows } = data;
        if (created.length + updated.length + deleted.length === 0) {
            setStatus(`Already in sync (${plural(notionRows, 'Notion row')}).`, 'success');
            return;
        }
        setStatus(
            `Synced ${plural(notionRows, 'Notion row')}: ${created.length} added, ` +
            `${updated.length} updated, ${deleted.length} removed from MongoDB.`,
            'success'
        );
    });
});

// Receipts can run over several pages, so read them all.
async function getAllText(pdfDocument) {
    const pages = [];
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum += 1) {
        pages.push(await getPageText(pageNum, pdfDocument));
    }
    return pages.join(' ');
}

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

