// backend/config/mongodb.js
// MongoDB connection using native driver — used for logs, tracking, notifications.
// MySQL remains the primary database for all relational/transactional data.

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/zipride';
const MONGO_DB  = process.env.MONGO_DB  || 'zipride';

let client = null;
let db     = null;

export async function connectMongoDB() {
  if (db) return db;
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(MONGO_DB);
    console.log('[MongoDB] Connected successfully to', MONGO_DB);
    return db;
  } catch (err) {
    console.warn('[MongoDB] Connection failed (non-fatal — MySQL still active):', err.message);
    db = null;
    return null;
  }
}

export function getMongoDB() {
  return db;
}

export function getDB() {
  return db;
}

export function isDBConnected() {
  return db !== null;
}

export async function closeMongoDB() {
  if (client) {
    await client.close();
    db     = null;
    client = null;
  }
}
