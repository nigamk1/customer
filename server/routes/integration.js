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
  getWidgetCode,
  uploadDocument,
  removeDocument
} = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: function(req, file, cb) {
    // Accept PDFs, text files, and common doc formats
    const filetypes = /pdf|txt|doc|docx|md|rtf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only document files are allowed!'));
  }
});

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

// Document upload routes
router.post('/:id/knowledge/document', protect, upload.single('document'), uploadDocument);
router.delete('/:id/knowledge/document/:documentId', protect, removeDocument);

// Public route for external websites to communicate with the AI
router.post('/chat', processExternalChat);

module.exports = router;