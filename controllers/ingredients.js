const Ingredient = require('../models/Ingredient');
const asyncWrapper = require('../middleware/async');
const { createNotionPages } = require('./notionService');

const normalizeLocation = (location) => {
    if (location === 'Freezer') return 'Frozen';
    return location || 'Missing';
};

const getAllIngredients = asyncWrapper(async (req, res) => {
    const ingredients = await Ingredient.find({});
    res.status(200).json({ ingredients });
});

const getMongoData = async () => Ingredient.find({});

const deleteIngredient = asyncWrapper(async (req, res) => {
    const { id: ingredientID } = req.params;
    const ingredient = await Ingredient.findOneAndDelete({ _id: ingredientID });

    if (!ingredient) {
        return res.status(404).json({ msg: `No ingredient with id: ${ingredientID}` });
    }

    res.status(200).json({ ingredient });
});

const updateIngredient = asyncWrapper(async (req, res) => {
    const { id: ingredientID } = req.params;
    const ingredient = await Ingredient.findOneAndUpdate(
        { _id: ingredientID },
        req.body,
        { new: true, runValidators: true }
    );

    if (!ingredient) {
        return res.status(404).json({ msg: `No ingredient with id: ${ingredientID}` });
    }

    res.status(200).json({ ingredient });
});

const addIngredients = asyncWrapper(async (req, res) => {
    const ingredients = req.body?.ingredients;
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ msg: 'Provide at least one ingredient' });
    }

    const ingredientObjects = ingredients.map((ingredient) => ({
        name: String(ingredient.name || '').trim(),
        location: normalizeLocation(ingredient.location)
    }));

    if (ingredientObjects.some((ingredient) => !ingredient.name)) {
        return res.status(400).json({ msg: 'Each ingredient needs a name' });
    }

    const insertedIngredients = await Ingredient.insertMany(ingredientObjects);
    const notionPages = await createNotionPages(insertedIngredients);

    res.status(201).json({ ingredients: insertedIngredients, notionPages });
});

module.exports = {
    getAllIngredients,
    getMongoData,
    deleteIngredient,
    updateIngredient,
    addIngredients
};
