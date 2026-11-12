const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Search and load .env from multiple standard locations
const possibleEnvPaths = [
  path.resolve(__dirname, '../../.env'),           // server/.env
  path.resolve(__dirname, '../../../.env'),          // project-root/.env
  path.resolve(process.cwd(), '.env'),              // current-dir/.env
  path.resolve(process.cwd(), 'server/.env'),       // current-dir/server/.env
];

let loadedEnvPath = null;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loadedEnvPath = envPath;
    break;
  }
}

if (!loadedEnvPath) {
  dotenv.config(); // fallback
}

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '2007', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME || 'hospital_management';

const poolConfig = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  database: dbName,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000,
};

// Only assign password if it's a non-empty string, otherwise keep undefined so error messages are descriptive
if (typeof dbPassword === 'string' && dbPassword.length > 0) {
  poolConfig.password = dbPassword;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB POOL ERROR] Unexpected error on idle client:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  envStatus: {
    loadedEnvPath,
    hasPassword: typeof dbPassword === 'string' && dbPassword.length > 0,
    dbHost,
    dbPort,
    dbUser,
    dbName,
  },
  testConnection: async () => {
    if (!poolConfig.password) {
      return {
        connected: false,
        error: 'DB_PASSWORD is not set or is empty in server/.env.',
        details: 'PostgreSQL requires password authentication. Please add DB_PASSWORD to server/.env.',
      };
    }

    try {
      const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
      return {
        connected: true,
        database: res.rows[0].db_name,
        time: res.rows[0].current_time,
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message,
      };
    }
  },
};
