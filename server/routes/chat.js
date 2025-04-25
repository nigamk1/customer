const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getChatHistory, 
  submitFeedback,
  escalateToHuman
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Public route for guests to use AI
router.post('/send', sendMessage);

// Protected routes
router.get('/history', protect, getChatHistory);
router.post('/feedback', protect, submitFeedback);
router.post('/escalate', protect, escalateToHuman);

module.exports = router;
