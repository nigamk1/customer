const express = require('express');
const router = express.Router();
const { 
  createIntegration, 
  getIntegrations, 
  getIntegration,
  updateIntegration, 
  deleteIntegration,
  generateApiKey,
  processExternalChat,
  addKnowledgeUrl,
  removeKnowledgeUrl,
  getWidgetCode
} = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');

// Private routes (require authentication)
router.route('/')
  .post(protect, createIntegration)
  .get(protect, getIntegrations);

router.route('/:id')
  .get(protect, getIntegration)
  .put(protect, updateIntegration)
  .delete(protect, deleteIntegration);

router.post('/:id/generate-key', protect, generateApiKey);
router.get('/:id/widget-code', protect, getWidgetCode);
router.post('/:id/knowledge/url', protect, addKnowledgeUrl);
router.delete('/:id/knowledge/url', protect, removeKnowledgeUrl);

// Public route for external websites to communicate with the AI
router.post('/chat', processExternalChat);

module.exports = router;