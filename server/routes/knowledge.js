const express = require('express');
const router = express.Router();
const { 
  uploadDocument,
  addWebpageUrl,
  configureExternalService,
  removeDocument,
  getDocuments 
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for document storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/documents');
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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// All routes are protected
router.post('/upload', protect, upload.single('document'), uploadDocument);
router.post('/add-url', protect, addWebpageUrl);
router.post('/configure-service', protect, configureExternalService);
router.delete('/document/:id', protect, removeDocument);
router.get('/documents/:integrationId', protect, getDocuments);

module.exports = router;
