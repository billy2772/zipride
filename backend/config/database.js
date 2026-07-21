// backend/config/database.js
// Database configuration module with slow query logging

import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT) || 3307,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Abirami@27',
  database: process.env.MYSQL_DATABASE || 'zipride',
  connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0,
  // Enables named timezone conversion
  timezone: '+05:30',
  // Slow query threshold (ms) — log any query taking longer
  slowQueryThresholdMs: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS) || 500,
};

export default dbConfig;
