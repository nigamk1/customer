const express = require('express');
const router = express.Router();

// Admin dashboard route
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

// Admin users management route
router.get('/users', (req, res) => {
  res.json({ message: 'Admin users management' });
});

// Admin settings route
router.get('/settings', (req, res) => {
  res.json({ message: 'Admin settings' });
});

module.exports = router;
