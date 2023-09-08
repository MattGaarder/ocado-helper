const express = require('express');
const router = express.Router();

const { getAllIngredients, updateIngredient, deleteIngredient, addIngredients } = require('../controllers/ingredients');

router.route('/').get(getAllIngredients);
router.route('/:id').patch(updateIngredient).delete(deleteIngredient);
router.route('/').post(addIngredients);

module.exports = router;