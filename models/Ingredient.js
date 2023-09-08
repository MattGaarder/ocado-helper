const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'must provide ingredient'],
        trim: true,
        minlength: [2, 'ingredient cannot be less than 3 characters']
    }
});

module.exports = mongoose.model('Ingredient', IngredientSchema);