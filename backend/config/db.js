import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connectionConfig = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,

  ssl: {
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
let isFallback = false;


// Mock database fallback
const mockDbPool = {
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


try {

  console.log(
    `[db.js] Connecting to MySQL: ${connectionConfig.host}:${connectionConfig.port}`
  );


  pool = mysql.createPool(connectionConfig);


  const conn = await pool.getConnection();

  console.log(
    '[db.js] Aiven MySQL Connection Successful'
  );


  conn.release();


} catch (err) {

  console.error(
    '[db.js] MySQL Connection Failed:',
    err.message
  );


  console.error(
    'Using Mock Database'
  );


  pool = mockDbPool;
  isFallback = true;

}


export const getDb = () => pool;

export const isMockActive = () => isFallback;

export default pool;
