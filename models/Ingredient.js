const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'must provide ingredient'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'must provide location'],
        trim: true
    },
    notionID: {
        type: String,
    }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
