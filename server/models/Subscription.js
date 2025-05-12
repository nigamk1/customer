const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['basic', 'premium']
  },
  paymentCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  planDetails: {
    monthlyPrice: Number,
    yearlyPrice: Number,
    name: String,
    description: String,
    chatLimit: Number,
    features: [String]
  },
  paymentId: {
    type: String
  },
  subscriptionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'trial', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  chatLimit: {
    type: Number
  },
  chatsUsed: {
    type: Number,
    default: 0
  },
  hadTrial: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);