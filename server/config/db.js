const mongoose = require('mongoose');

const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Setup event handlers for persistent connection
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected! Attempting to reconnect...');
      setTimeout(() => connectDB(), 5000);
    });
    
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    
    if (retryCount < maxRetries) {
      console.log(`Retrying connection (${retryCount + 1}/${maxRetries}) in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      console.error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      return null; // Don't exit process, return null instead
    }
  }
};

module.exports = connectDB;
