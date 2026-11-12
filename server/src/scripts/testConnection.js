const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

// Search possible .env locations
const possibleEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
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
  dotenv.config();
}

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '2007', 10);
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME || 'hospital_management';

console.log('====================================================');
console.log('   POSTGRESQL CONNECTION DIAGNOSTIC UTILITY');
console.log('====================================================');
console.log(`  Target Host      : ${host}`);
console.log(`  Target Port      : ${port}`);
console.log(`  Database User    : ${user}`);
console.log(`  Target Database  : ${database}`);
console.log(`  .env File Found  : ${loadedEnvPath ? loadedEnvPath : 'NO (.env file is missing!)'}`);
console.log(`  DB_PASSWORD set  : ${typeof password === 'string' && password.length > 0 ? 'YES (configured)' : 'NO (missing or empty)'}`);
console.log('----------------------------------------------------');

if (!loadedEnvPath) {
  console.log('\n[DIAGNOSTIC] ACTION REQUIRED:');
  console.log('  1. Create a file named .env inside the server/ directory:');
  console.log('     Copy from server/.env.example to server/.env');
  console.log('  2. Set DB_PASSWORD to your PostgreSQL password.');
  process.exit(1);
}

if (!password || password.trim() === '') {
  console.log('\n[DIAGNOSTIC] ACTION REQUIRED:');
  console.log('  DB_PASSWORD is missing or blank in your server/.env file.');
  console.log('  Open server/.env and add:');
  console.log('    DB_PASSWORD=your_actual_password');
  process.exit(1);
}

const runTest = async () => {
  // Step 1: Test basic server authentication using maintenance DB 'postgres'
  console.log('\n[Step 1/3] Testing PostgreSQL server authentication...');
  const serverClient = new Client({ host, port, user, password, database: 'postgres' });

  try {
    await serverClient.connect();
    console.log('  [SUCCESS] Server authentication succeeded! Credentials are valid.');

    // Step 2: Check if target database exists
    console.log('\n[Step 2/3] Checking if database "' + database + '" exists...');
    const dbCheck = await serverClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database]
    );

    const exists = dbCheck.rows.length > 0;
    if (exists) {
      console.log(`  [SUCCESS] Database "${database}" exists!`);
    } else {
      console.log(`  [NOTICE] Database "${database}" does not exist yet.`);
      console.log(`  [ACTION] Run "npm run seed" inside the server/ folder to automatically create and populate it.`);
    }

    await serverClient.end();

    if (exists) {
      // Step 3: Test connection to target database and count tables
      console.log('\n[Step 3/3] Inspecting "' + database + '" tables and views...');
      const targetClient = new Client({ host, port, user, password, database });
      await targetClient.connect();

      const tableRes = await targetClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tables = tableRes.rows.map(r => r.table_name);
      console.log(`  [SUCCESS] Found ${tables.length} tables:`, tables.join(', ') || 'No tables yet');

      if (tables.length === 0) {
        console.log(`  [ACTION] Tables are not created yet. Run "npm run seed" to execute schema.sql and seed.sql.`);
      } else {
        console.log('\n====================================================');
        console.log('  ALL CHECKS PASSED! YOUR DATABASE IS READY TO USE.');
        console.log('====================================================');
      }

      await targetClient.end();
    }
  } catch (err) {
    console.error('\n  [ERROR] Connection failed:');
    console.error(`  ${err.message}`);
    if (err.message.includes('password authentication failed')) {
      console.error('\n  [HINT] The password in server/.env does not match your PostgreSQL "postgres" user password.');
      console.error('  Please verify the password you use when logging into pgAdmin 4.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`\n  [HINT] Connection refused on port ${port}. Ensure PostgreSQL service is running.`);
    }
  }
};

runTest();
