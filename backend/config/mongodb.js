// backend/config/mongodb.js
// MongoDB connection using Mongoose

import mongoose from "mongoose";

let isConnected = false;

export async function connectMongoDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === "") {
    const err = new Error("MONGODB_URI environment variable is missing.");
    console.error(`❌ MongoDB Connection Failed: ${err.message}`);
    throw err;
  }

  // Already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }

  try {
    await mongoose.connect(mongoUri);

    isConnected = true;

    console.log("✅ MongoDB Connected");

    return mongoose.connection.db;
  } catch (err) {
    isConnected = false;

    console.error(`❌ MongoDB Connection Failed: ${err.message}`);

    throw err;
  }
}

export function getMongoDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  return null;
}

export function getDB() {
  return getMongoDB();
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

export async function closeMongoDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export default connectMongoDB;
