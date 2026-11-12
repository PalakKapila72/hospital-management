const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables before initializing app and routes
const possibleEnvPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log(`====================================================`);
  console.log(`  HOSPITAL MANAGEMENT SYSTEM — BACKEND SERVER`);
  console.log(`  Status   : STARTING`);
  console.log(`  Port     : ${PORT}`);
  console.log(`  Env      : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Config   : Host=${db.envStatus.dbHost}, Port=${db.envStatus.dbPort}, User=${db.envStatus.dbUser}`);
  console.log(`  .env file: ${db.envStatus.loadedEnvPath ? db.envStatus.loadedEnvPath : 'NOT FOUND (Please create server/.env)'}`);
  console.log(`====================================================`);

  // Test PostgreSQL connection
  const dbStatus = await db.testConnection();
  if (dbStatus.connected) {
    console.log(`[DATABASE] Connected to PostgreSQL '${dbStatus.database}' at ${dbStatus.time}`);
  } else {
    console.warn(`[DATABASE WARNING] Could not connect to PostgreSQL:`);
    console.warn(`  Reason  : ${dbStatus.error}`);
    if (dbStatus.details) console.warn(`  Action  : ${dbStatus.details}`);
    console.warn('  Guidance: Create server/.env with DB_PASSWORD=<your_postgres_password>');
  }

  const server = app.listen(PORT, () => {
    console.log(`\n  API Root : http://localhost:${PORT}/api`);
    console.log(`  Health   : http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n[SERVER] Gracefully shutting down...');
    server.close(async () => {
      try {
        await db.pool.end();
        console.log('[DATABASE] Pool connections closed.');
      } catch (err) {
        console.error('[DATABASE] Error closing pool:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
