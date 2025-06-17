const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  integration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteIntegration',
    required: true
  },
  documentType: {
    type: String,
    enum: ['pdf', 'text', 'markdown', 'webpage', 'notion', 'zendesk', 'help_scout', 'intercom'],
    required: true
  },
  source: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Store document embeddings in a separate field
  // We'll store them as an array of arrays, but access will be done through a vector DB
  embeddings: {
    type: mongoose.Schema.Types.Mixed
  },
  // Connection information for external services
  connectionConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
