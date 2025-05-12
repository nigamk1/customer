const express = require('express');
const router = express.Router();
const { 
  createSubscription, 
  getSubscription,
  updateSubscription, 
  cancelSubscription,
  verifyPayment,
  createOrder,
  handleWebhook,
  startTrial
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Protected routes
router.route('/')
  .post(protect, createSubscription)
  .get(protect, getSubscription);

router.post('/cancel', protect, cancelSubscription);
router.post('/verify', protect, verifyPayment);
router.post('/order', protect, createOrder);
router.post('/trial', protect, startTrial);

// Webhook for payment provider (no auth required)
router.post('/webhook', handleWebhook);

module.exports = router;