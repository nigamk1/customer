const express = require('express');
const router = express.Router();
const { 
  getAnalytics,
  getChatLogs,
  getFrequentQuestions 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.get('/:integrationId', protect, getAnalytics);
router.get('/:integrationId/logs', protect, getChatLogs);
router.get('/:integrationId/faqs', protect, getFrequentQuestions);

module.exports = router;
