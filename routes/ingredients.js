const express = require('express');
const router = express.Router();

const { getAllIngredients, updateIngredient, deleteIngredient } = require('../controllers/ingredients');

router.route('/').get(getAllIngredients);
router.route('/:id').patch(updateIngredient).delete(deleteIngredient);

module.exports = router;