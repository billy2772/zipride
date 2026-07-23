// backend/config/db.js
// MySQL connection pool — reads exclusively from environment variables.
// No hardcoded defaults. Fails fast on missing or invalid config.

import mysql from 'mysql2/promise';

// Validate required MySQL env vars (envValidator.js handles the full check on startup,
// but we guard here too so this module can never silently use wrong values).
const MYSQL_HOST     = process.env.MYSQL_HOST;
const MYSQL_PORT     = Number(process.env.MYSQL_PORT);
const MYSQL_USER     = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;

if (!MYSQL_HOST || MYSQL_HOST.trim() === '') {
  console.error('❌ [db.js] MYSQL_HOST is not set. Cannot connect to MySQL.');
  process.exit(1);
}

if (!MYSQL_PORT || isNaN(MYSQL_PORT)) {
  console.error('❌ [db.js] MYSQL_PORT is not set or is not a valid number.');
  process.exit(1);
}

const connectionConfig = {
  host:     MYSQL_HOST,
  port:     MYSQL_PORT,
  user:     MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,

  ssl: {
    rejectUnauthorized: false
  },

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
};

let pool;
let isFallback = false;

try {
  console.log(`[db.js] Connecting to MySQL at ${MYSQL_HOST}:${MYSQL_PORT} (database: ${MYSQL_DATABASE}) …`);

  pool = mysql.createPool(connectionConfig);

  const conn = await pool.getConnection();
  conn.release();

  console.log(`✅ MySQL Connected — host: ${MYSQL_HOST}:${MYSQL_PORT}, database: ${MYSQL_DATABASE}`);

} catch (err) {
  console.error(`❌ MySQL Connection Failed: ${err.message}`);

  if (process.env.NODE_ENV === 'production') {
    console.error('[db.js] Production environment — refusing to continue without a real MySQL connection.');
    process.exit(1);
  }

  // Development only: warn and continue with a no-op mock so the process stays alive
  // for local work without a running MySQL instance.
  console.warn('[db.js] ⚠️  Development mode — falling back to mock DB pool. Queries will return empty results.');

  pool = {
    isMock: true,

    async execute(sql, params = []) {
      console.warn(`[Mock Execute] SQL: ${sql}`, params);
      return [[], []];
    },

    async query(sql, params = []) {
      console.warn(`[Mock Query] SQL: ${sql}`, params);
      return [[], []];
    },

    async getConnection() {
      return {
        execute: async (sql, params = []) => {
          console.warn(`[Mock Conn Execute] SQL: ${sql}`, params);
          return [[], []];
        },

        query: async (sql, params = []) => {
          console.warn(`[Mock Conn Query] SQL: ${sql}`, params);
          return [[], []];
        },

        beginTransaction: async () => {
          console.log('[Mock Transaction] Begin');
        },

        commit: async () => {
          console.log('[Mock Transaction] Commit');
        },

        rollback: async () => {
          console.log('[Mock Transaction] Rollback');
        },

        release: () => {}
      };
    }
  };

  isFallback = true;
}

export const getDb = () => pool;

export const isMockActive = () => isFallback;

export default pool;
