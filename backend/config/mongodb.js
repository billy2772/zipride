// backend/config/mongodb.js
// MongoDB connection using Mongoose

import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB() {
  const mongoUri = process.env.MONGODB_URI;

  // Check MongoDB URI
  if (!mongoUri || mongoUri.trim() === "") {
    const err = new Error("MONGODB_URI environment variable is missing.");
    console.error(`❌ MongoDB Connection Failed: ${err.message}`);
    throw err;
  }

  // Debug check (shows only first part of URI)
  console.log(
    "MongoDB URI loaded:",
    mongoUri.substring(0, 30) + "..."
  );

  // Already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return mongoose.connection.db;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;

    console.log("✅ MongoDB Connected Successfully");

    return mongoose.connection.db;

  } catch (err) {

    isConnected = false;

    console.error(
      `❌ MongoDB Connection Failed: ${err.message}`
    );

    throw err;
  }
}


// Get MongoDB instance
export function getMongoDB() {

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }

  return null;
}


// Alias function
export function getDB() {
  return getMongoDB();
}


// Check connection status
export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}


// Close MongoDB connection
export async function closeMongoDB() {

  try {

    if (mongoose.connection.readyState !== 0) {

      await mongoose.disconnect();

      isConnected = false;

      console.log("✅ MongoDB Disconnected");

    }

  } catch (err) {

    console.error(
      `❌ MongoDB Disconnect Failed: ${err.message}`
    );

  }
}


export default connectMongoDB;
