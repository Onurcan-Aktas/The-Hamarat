const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getSession,
  clearSession,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:recipeId', protect, getSession);
router.post('/:recipeId', protect, sendMessage);
router.delete('/:recipeId', protect, clearSession);

module.exports = router;
