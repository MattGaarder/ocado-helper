const Ingredient = require('../models/Ingredient');
const asyncWrapper = require('../middleware/async');


const getAllIngredients = asyncWrapper(async (req, res, next) => {
    const ingredients = await Ingredient.find({});
    res.status(200).json({ ingredients });
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
    console.log(ingredients);
    const ingredientObjects = ingredients.map(name => ({ name }));
    // name => { // can also be written as 
    //     return { name: name };
    //   }
    console.log(ingredientObjects)
    const insertedIngredients = await Ingredient.insertMany(ingredientObjects);
    res.status(200).json({ ingredients: insertedIngredients });
})

module.exports = { getAllIngredients, deleteIngredient, updateIngredient, addIngredients }