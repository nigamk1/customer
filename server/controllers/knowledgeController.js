const KnowledgeBase = require('../models/KnowledgeBase');
const WebsiteIntegration = require('../models/WebsiteIntegration');
const { processDocument } = require('../services/documentProcessor');
const { addDocumentToVectorDb, removeDocumentFromVectorDb } = require('../services/vectorDb');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for document storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

exports.upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: function (req, file, cb) {
    // Accept PDFs, text, and markdown files
    const filetypes = /pdf|txt|text|md|markdown/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('File upload only supports PDF, TXT, and Markdown formats.'));
  }
});

// @desc    Upload and process a document
// @route   POST /api/knowledge/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document uploaded' });
    }
    
    const integrationId = req.body.integrationId;
    
    // Verify integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      // Remove uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Determine document type from file extension
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let documentType;
    
    if (fileExtension === '.pdf') {
      documentType = 'pdf';
    } else if (fileExtension === '.md' || fileExtension === '.markdown') {
      documentType = 'markdown';
    } else {
      documentType = 'text';
    }
    
    // Process the document
    const { title, content } = await processDocument(
      documentType,
      req.file.path,
      { title: req.body.title || req.file.originalname }
    );
    
    // Add document to vector database
    const chunkIds = await addDocumentToVectorDb(
      integrationId,
      req.file.filename,
      content,
      { title, documentType }
    );
    
    // Create knowledge base entry
    const knowledgeBase = new KnowledgeBase({
      integration: integrationId,
      documentType,
      source: req.file.path,
      title,
      content,
      metadata: {
        originalFilename: req.file.originalname,
        storedFilename: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        chunkIds
      }
    });
    
    await knowledgeBase.save();
    
    // Update integration's knowledge base documents
    await WebsiteIntegration.findByIdAndUpdate(
      integrationId,
      {
        'knowledgeBase.enabled': true,
        'knowledgeBase.vectorSearch.enabled': true,
        $push: {
          'knowledgeBase.documents': {
            name: title,
            documentType,
            url: req.file.path,
            lastIndexed: new Date(),
            status: 'indexed'
          }
        }
      }
    );
    
    res.status(201).json({
      message: 'Document uploaded and processed successfully',
      documentId: knowledgeBase._id,
      title,
      documentType
    });
    
  } catch (err) {
    console.error('Document upload error:', err);
    
    // Remove uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Error uploading document', 
      error: err.message
    });
  }
};

// @desc    Add a webpage URL to knowledge base
// @route   POST /api/knowledge/add-url
// @access  Private
exports.addWebpageUrl = async (req, res) => {
  try {
    const { integrationId, url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    
    // Check if integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Process the webpage
    const { title, content } = await processDocument('webpage', url);
    
    // Add to vector database
    const chunkIds = await addDocumentToVectorDb(
      integrationId,
      `url_${Date.now()}`,
      content,
      { title, url, documentType: 'webpage' }
    );
    
    // Create knowledge base entry
    const knowledgeBase = new KnowledgeBase({
      integration: integrationId,
      documentType: 'webpage',
      source: url,
      title,
      content,
      metadata: {
        url,
        chunkIds
      }
    });
    
    await knowledgeBase.save();
    
    // Update integration's knowledge base URLs
    await WebsiteIntegration.findByIdAndUpdate(
      integrationId,
      {
        'knowledgeBase.enabled': true,
        'knowledgeBase.vectorSearch.enabled': true,
        $push: {
          'knowledgeBase.urls': {
            url,
            title,
            lastIndexed: new Date(),
            status: 'indexed'
          }
        }
      }
    );
    
    res.status(201).json({
      message: 'URL added to knowledge base successfully',
      documentId: knowledgeBase._id,
      title,
      url
    });
    
  } catch (err) {
    console.error('URL addition error:', err);
    res.status(500).json({ 
      message: 'Error adding URL to knowledge base', 
      error: err.message
    });
  }
};

// @desc    Configure external knowledge base service
// @route   POST /api/knowledge/configure-service
// @access  Private
exports.configureExternalService = async (req, res) => {
  try {
    const { integrationId, serviceType, connectionDetails } = req.body;
    
    if (!serviceType || !connectionDetails) {
      return res.status(400).json({ message: 'Service type and connection details are required' });
    }
    
    // Validate service type
    const validServiceTypes = ['notion', 'zendesk', 'help_scout', 'intercom'];
    if (!validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ message: 'Invalid service type' });
    }
    
    // Check if integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Check for existing service configuration
    const existingServiceIndex = integration.knowledgeBase.externalServices?.findIndex(
      service => service.type === serviceType
    );
    
    if (existingServiceIndex >= 0) {
      // Update existing service
      integration.knowledgeBase.externalServices[existingServiceIndex] = {
        type: serviceType,
        connectionDetails,
        status: 'connected',
        lastSynced: new Date()
      };
    } else {
      // Add new service
      if (!integration.knowledgeBase.externalServices) {
        integration.knowledgeBase.externalServices = [];
      }
      
      integration.knowledgeBase.externalServices.push({
        type: serviceType,
        connectionDetails,
        status: 'connected',
        lastSynced: new Date()
      });
    }
    
    // Enable knowledge base if not already
    integration.knowledgeBase.enabled = true;
    
    await integration.save();
    
    // Here you would implement service-specific connection validation
    // For now, we'll just return success
    
    res.json({
      message: `${serviceType} integration configured successfully`,
      status: 'connected'
    });
    
  } catch (err) {
    console.error('Service configuration error:', err);
    res.status(500).json({ 
      message: 'Error configuring external service', 
      error: err.message
    });
  }
};

// @desc    Remove document from knowledge base
// @route   DELETE /api/knowledge/document/:id
// @access  Private
exports.removeDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // Find document and verify ownership
    const document = await KnowledgeBase.findById(documentId)
      .populate('integration', 'user');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user owns the integration
    if (document.integration.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to remove this document' });
    }
    
    // Remove from vector database
    await removeDocumentFromVectorDb(
      document.integration._id.toString(),
      document.metadata.storedFilename || documentId
    );
    
    // Remove file if it's a local file
    if (document.documentType !== 'webpage' && fs.existsSync(document.source)) {
      fs.unlinkSync(document.source);
    }
    
    // Remove document reference from integration
    if (document.documentType === 'webpage') {
      await WebsiteIntegration.updateOne(
        { _id: document.integration._id },
        { $pull: { 'knowledgeBase.urls': { url: document.source } } }
      );
    } else {
      await WebsiteIntegration.updateOne(
        { _id: document.integration._id },
        { $pull: { 'knowledgeBase.documents': { url: document.source } } }
      );
    }
    
    // Delete the knowledge base entry
    await KnowledgeBase.findByIdAndDelete(documentId);
    
    res.json({ message: 'Document removed successfully from knowledge base' });
    
  } catch (err) {
    console.error('Document removal error:', err);
    res.status(500).json({ 
      message: 'Error removing document from knowledge base', 
      error: err.message
    });
  }
};

// @desc    List all documents in knowledge base
// @route   GET /api/knowledge/documents/:integrationId
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    const integrationId = req.params.integrationId;
    
    // Check if integration exists and belongs to user
    const integration = await WebsiteIntegration.findOne({ 
      _id: integrationId, 
      user: req.user.id 
    });
    
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Get all documents for this integration
    const documents = await KnowledgeBase.find({ integration: integrationId })
      .select('title documentType source metadata createdAt lastUpdated');
    
    res.json(documents);
    
  } catch (err) {
    console.error('Error retrieving knowledge base documents:', err);
    res.status(500).json({ 
      message: 'Error retrieving knowledge base documents', 
      error: err.message
    });
  }
};
