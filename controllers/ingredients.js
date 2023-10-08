const Ingredient = require('../models/Ingredient');
const asyncWrapper = require('../middleware/async');


const getAllIngredients = asyncWrapper(async (req, res, next) => {
    const ingredients = await Ingredient.find({});
    res.status(200).json({ ingredients });
});

const getMongoData = asyncWrapper(async () => {
    const ingredients = await Ingredient.find({});
    return ingredients;
});

const deleteIngredient = asyncWrapper(async (req, res, next) => {
    const {id: ingredientID} = req.params;
    const ingredient = await Ingredient.findOneAndDelete( {_id: ingredientID} );
    if(!ingredient){
        return res.status(404).json({msg: `No ingredient with id: ${ingredientID}`}); // beware this line
    }
    res.status(200).json({ ingredient });
});

const updateIngredient = asyncWrapper(async (req, res, next) => {
    const {id: ingredientID} = req.params;
    const ingredient = await Ingredient.findOneAndUpdate( {_id: ingredientID});
    if(!ingredient){
        return res.status(404).json({msg: `No ingredient with id: ${ingredientID}`}); // beware this line
    }
    res.status(200).json({ ingredient });
});

const addIngredients = asyncWrapper(async (req, res, next) => {
    const ingredients = req.body.ingredients;
    console.log(req.body);
    console.log("🚀 ~ file: ingredients.js:35 ~ addIngredients ~ ingredients:", ingredients)
    const ingredientObjects = ingredients.map(ingredient => ({
        name: ingredient.name,
        location: ingredient.location }));
    const insertedIngredients = await Ingredient.insertMany(ingredientObjects);
    res.status(200).json({ ingredients: insertedIngredients });
});

const addNotionIDToMongoEntryVariable = async function addNotionIDToMongoEntry(notionDataArray) {
    // console.log(notionDataArray);
    const updatedIngredients = [];
    for (let el of notionDataArray) {
        let mongoID = el.properties.MONGO_ID.rich_text[0].plain_text;
        let notionID = el.id;
        // console.log("notionID when iterating through addNotionIDToMongoEntryVariable", notionID)
        // Update the document found by `_id` with the new `notionID`
        const ingredient = await Ingredient.findOneAndUpdate(
            { _id: mongoID }, // filter
            { notionID: notionID }, // update
            { new: true } // options: return updated doc
        );
        if (ingredient) {
            console.log("Updated ingredient", ingredient);
            updatedIngredients.push(ingredient);
        } else {
            console.log(`No ingredient found for Mongo ID: ${mongoID}`);
        }
    }
    return updatedIngredients;
}


module.exports = { getAllIngredients, deleteIngredient, updateIngredient, addIngredients, addNotionIDToMongoEntryVariable, getMongoData }


// the submit button in the webpage will call addIngredients.
// in the front-end this will execute the following code:
// await axios.post('/api/v1/ingredients', { ingredients: selectedIngredients });
// await axios.get('/api/v1/notion');
// note that ingredients here is an object with property of ingredients and value of an array of selected ingredients
// these are added to mongo one by one and given an ID
// when this proccess is done my notion api is called to get from mongo db
// I am adding MONGO_ID as a property in the process
// that's what this is. 

// const getData = asyncWrapper(async(req, res) => {
//     const mongoData = await myMongooseModel.find({});
//     if (!mongoData) {
//         return res.status(404).json({ error: 'Data not found in MongoDB' });
//     }
//     const createdRows = [];
//     for(let data of mongoData){
//         console.log("logging data.name when iterating through data of mondoData in notionService", data);
//         const notionData = await notion.pages.create({
//             "parent": {
//                 "type": "database_id",  // Replace with your Notion database ID
//                 "database_id": process.env.NOTION_DATABASE_ID
//             },
//             "properties": {
//                 "Name": {
//                     "title": [
//                         {
//                             "type": "text",
//                             "text": {
//                                 "content": data.name,
//                             }
//                         }
//                     ]
//                 },
//                 "MONGO_ID": {
//                     "rich_text": [
//                         {
//                             "type": "text",
//                             "text": {
//                                 "content": data._id.toString(),
//                             }
//                         }
//                     ]
//                 },                 
//             }
//         });
//         createdRows.push(notionData)
//     }
//     res.status(200).json({ mongoData, createdRows });
// });
// In created rows I have all of the notion data including the notion id
// I want to iterate through createdRows calling updateIngredient on each
// or actually what makes much more sense is to create a third function that performs this function only
// function updateMongoEntryWithNotionID(){}
// this can take an array (createdRows) as a parameter 
// what this function will do is go through each element, it could maybe use the already existing mongoDB id in there to find the mongo entry
// and then update the entry with the notion ID