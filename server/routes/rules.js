const express = require('express');
const router = express.Router();
const { 
  updateBusinessRules,
  getBusinessRules 
} = require('../controllers/businessRulesController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.put('/:integrationId', protect, updateBusinessRules);
router.get('/:integrationId', protect, getBusinessRules);

module.exports = router;
