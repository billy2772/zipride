// backend/scripts/clearDatabase.js
// Safe utility to truncate all database tables (deleting all records, but preserving table schemas).
// Run: node scripts/clearDatabase.js

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT) || 3307,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Abirami@27',
  database: process.env.MYSQL_DATABASE || 'zipride',
};

async function clearDatabase() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('[Clear DB] Connected to database. Fetching tables...');

    // Get all tables
    const [tables] = await conn.execute('SHOW TABLES');
    if (tables.length === 0) {
      console.log('[Clear DB] No tables found in the database. Nothing to clear.');
      return;
    }

    const tableKey = Object.keys(tables[0])[0];
    const tableNames = tables.map(t => t[tableKey]);

    console.log(`[Clear DB] Found ${tableNames.length} tables to truncate.`);

    // Disable foreign key checks
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔑 Disabled foreign key checks.');

    for (const tableName of tableNames) {
      await conn.execute(`TRUNCATE TABLE \`${tableName}\``);
      console.log(`🧹 Truncated table: ${tableName}`);
    }

    // Re-enable foreign key checks
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔑 Re-enabled foreign key checks.');

    console.log('\n🎉 Successfully cleared all data from all database tables!\n');
  } catch (err) {
    console.error('[Clear DB] ❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

clearDatabase();
