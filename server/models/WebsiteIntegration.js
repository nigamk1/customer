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
    vectorSearch: {
      enabled: {
        type: Boolean,
        default: false
      },
      lastIndexed: {
        type: Date
      }
    },
    urls: [{
      url: {
        type: String,
        trim: true
      },
      title: String,
      lastIndexed: Date,
      status: {
        type: String,
        enum: ['pending', 'indexed', 'failed'],
        default: 'pending'
      }
    }],
    documents: [{
      name: String,
      content: String,
      url: String,
      documentType: {
        type: String,
        enum: ['pdf', 'text', 'markdown', 'webpage', 'notion', 'zendesk', 'help_scout', 'intercom']
      },
      lastIndexed: Date,
      status: {
        type: String,
        enum: ['pending', 'indexed', 'failed'],
        default: 'pending'
      }
    }],
    externalServices: [{
      type: {
        type: String,
        enum: ['notion', 'zendesk', 'help_scout', 'intercom'],
        required: true
      },
      connectionDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
      },
      status: {
        type: String,
        enum: ['connected', 'disconnected', 'failed'],
        default: 'disconnected'
      },
      lastSynced: Date
    }]
  },
  // New feature: Tool integration (API endpoints)
  toolsConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  businessRules: {
    escalationThreshold: {
      type: Number,
      default: 0.7, // Confidence threshold for escalation
      min: 0,
      max: 1
    },
    escalationContacts: [{
      name: String,
      email: String,
      notificationChannel: {
        type: String,
        enum: ['email', 'slack', 'webhook'],
        default: 'email'
      },
      webhookUrl: String
    }],
    businessHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        open: String,
        close: String
      }],
      outOfHoursMessage: {
        type: String,
        default: "We're currently closed. We'll get back to you during our business hours."
      }
    },
    triggerKeywords: [{
      keyword: String,
      action: {
        type: String,
        enum: ['escalate', 'tag', 'notify'],
        default: 'escalate'
      }
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