const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'must provide ingredient'],
        trim: true,
        minlength: [4, 'ingredient cannot be less than 3 characters']
    },
    location: {
        type: String,
        required: [true, 'must provide location'],
        trim: true,
        minlength: [4, 'location cannot be less than 3 characters']
    },
    notionID: {
        type: String,
    }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);