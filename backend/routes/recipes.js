const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesByUser,
  toggleLike,
} = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');

router.get('/', getRecipes);
router.get('/user/:userId', getRecipesByUser);
router.get('/:id', getRecipeById);
router.post('/', protect, createRecipe);
router.put('/:id', protect, updateRecipe);
router.delete('/:id', protect, deleteRecipe);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
