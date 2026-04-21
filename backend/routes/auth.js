const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getFavorites,
  toggleFavorite,
  removeFavorite,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Favorites
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:recipeId', protect, toggleFavorite);
router.delete('/favorites/:recipeId', protect, removeFavorite);

module.exports = router;
