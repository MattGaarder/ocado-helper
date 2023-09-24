const express = require('express');
const router = express.Router();

const { getAllIngredients, updateIngredient, deleteIngredient, addIngredients, getMongoData } = require('../controllers/ingredients');

router.route('/').get(getAllIngredients, getMongoData);
router.route('/:id').patch(updateIngredient).delete(deleteIngredient);
router.route('/').post(addIngredients);

module.exports = router;