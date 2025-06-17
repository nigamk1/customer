const express = require('express');
const router = express.Router();
const { 
  configureTool,
  getAvailableTools,
  getConfiguredTools,
  removeTool,
  testTool
} = require('../controllers/toolsController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/configure', protect, configureTool);
router.get('/available', protect, getAvailableTools);
router.get('/configured/:integrationId', protect, getConfiguredTools);
router.delete('/:integrationId/:toolName', protect, removeTool);
router.post('/test', protect, testTool);

module.exports = router;
