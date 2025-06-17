const mongoose = require('mongoose');
const dns = require('dns');
const url = require('url');

/**
 * Utility to diagnose MongoDB connection issues
 */
async function diagnoseMongoDBConnection(mongoUri) {
  try {
    if (!mongoUri) {
      return {
        success: false,
        message: 'MongoDB URI is not defined in environment variables'
      };
    }

    // Parse the MongoDB connection string
    const parsedUrl = url.parse(mongoUri);
    
    if (!parsedUrl.hostname) {
      return {
        success: false,
        message: 'Invalid MongoDB URI format: hostname not found'
      };
    }

    // Check if the hostname is resolvable
    try {
      const dnsLookupPromise = new Promise((resolve, reject) => {
        dns.lookup(parsedUrl.hostname, (err, address) => {
          if (err) {
            reject(err);
          } else {
            resolve(address);
          }
        });
      });

      // Set timeout for DNS lookup (2 seconds)
      const dnsResult = await Promise.race([
        dnsLookupPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS lookup timeout')), 2000)
        )
      ]);

      console.log(`MongoDB hostname ${parsedUrl.hostname} resolved to ${dnsResult}`);
    } catch (dnsError) {
      return {
        success: false,
        message: `Cannot resolve MongoDB hostname: ${dnsError.message}. Check your network connection or MongoDB URI.`
      };
    }

    // Try to connect with a short timeout
    try {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });

      // If we got here, connection was successful
      await mongoose.connection.close();
      return {
        success: true,
        message: 'MongoDB connection successful'
      };
    } catch (connError) {
      return {
        success: false,
        message: `MongoDB connection failed: ${connError.message}`,
        details: connError
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Unexpected error during diagnosis: ${error.message}`,
      details: error
    };
  }
}

module.exports = { diagnoseMongoDBConnection };
