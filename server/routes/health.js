const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { diagnoseMongoDBConnection } = require('../utils/dbDiagnostics');

// @desc    Get API health status
// @route   GET /api/health/status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({
      success: true,
      timestamp: new Date(),
      services: {
        api: 'Online',
        mongodb: mongoStatus
      }
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error checking service health',
      error: err.message
    });
  }
});

// @desc    Diagnose MongoDB connection issues
// @route   GET /api/health/db-diagnose
// @access  Public
router.get('/db-diagnose', async (req, res) => {
  try {
    const result = await diagnoseMongoDBConnection(process.env.MONGO_URI);
    
    if (result.success) {
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,
        // Only include safe details
        details: result.details ? {
          name: result.details.name,
          code: result.details.code,
          codeName: result.details.codeName
        } : null
      });
    }
  } catch (err) {
    console.error('DB diagnostics error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error diagnosing database connection',
      error: err.message
    });
  }
});

module.exports = router;
