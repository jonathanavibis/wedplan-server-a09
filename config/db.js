const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI is not defined.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Never process.exit(1) in serverless environments to prevent FUNCTION_INVOCATION_FAILED
  }
};

module.exports = connectDB;
