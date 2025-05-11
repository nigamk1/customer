const mongoose = require('mongoose');

const WebsiteIntegrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a name for this integration'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Please provide the domain for your website'],
    match: [
      /^(?:(?:https?):\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/.*)?$/,
      'Please provide a valid domain'
    ]
  },
  apiKey: {
    type: String,
    unique: true
  },
  widgetSettings: {
    primaryColor: {
      type: String,
      default: '#4F46E5' // Default primary color
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right'
    },
    welcomeMessage: {
      type: String,
      default: 'Hi there! How can I help you today?'
    },
    chatTitle: {
      type: String,
      default: 'Customer Support'
    }
  },
  knowledgeBase: {
    enabled: {
      type: Boolean,
      default: false
    },
    urls: [{
      type: String,
      trim: true
    }],
    documents: [{
      name: String,
      content: String,
      url: String
    }]
  },
  allowFileAttachments: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate API key before saving
WebsiteIntegrationSchema.pre('save', async function(next) {
  if (!this.apiKey) {
    // Generate a random API key
    const crypto = require('crypto');
    this.apiKey = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('WebsiteIntegration', WebsiteIntegrationSchema);