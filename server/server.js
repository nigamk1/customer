require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000']
  }
});

// Connect to MongoDB with retry mechanism
const connectWithRetry = () => {
  const mongoURI = process.env.MONGO_URI || '';
  console.log('Attempting to connect to MongoDB...');
  
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000 // Close sockets after 45s of inactivity
  })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

connectWithRetry();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure required directories exist
const dataDirPath = path.join(__dirname, 'data/vector_db');
const uploadsDirPath = path.join(__dirname, 'uploads/documents');

if (!fs.existsSync(dataDirPath)) {
  fs.mkdirSync(dataDirPath, { recursive: true });
  console.log('Created vector database directory');
}

if (!fs.existsSync(uploadsDirPath)) {
  fs.mkdirSync(uploadsDirPath, { recursive: true });
  console.log('Created document uploads directory');
}

// Logging middleware in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve the widget JavaScript file
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.js'));
});

// Demo routes
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

app.get('/demo.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.js'));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/integration', require('./routes/integration'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/rules', require('./routes/rules'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/health', require('./routes/health'));

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_chat', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their chat room`);
  });
  
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Always serve static assets in production environment or on Render
// Check if running on Render or if NODE_ENV is set to production
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

if (isProduction) {
  console.log('Running in production mode, serving static files');
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // For any request that doesn't match an API route, send the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
} else {
  console.log('Running in development mode');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`));
