const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '2007', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  targetDb: process.env.DB_NAME || 'hospital_management',
};

const runInit = async () => {
  console.log('====================================================');
  console.log(' HOSPITAL MANAGEMENT SYSTEM — DATABASE INITIALIZER');
  console.log(` Target Host : ${config.host}:${config.port}`);
  console.log(` User        : ${config.user}`);
  console.log(` Database    : ${config.targetDb}`);
  console.log('====================================================');

  // Step 1: Connect to default 'postgres' maintenance DB to ensure target DB exists
  const maintenanceClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
  });

  try {
    await maintenanceClient.connect();
    console.log('[1/6] Connected to PostgreSQL instance.');

    const checkDbRes = await maintenanceClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.targetDb]
    );

    if (checkDbRes.rows.length === 0) {
      console.log(`[2/6] Database '${config.targetDb}' does not exist. Creating...`);
      await maintenanceClient.query(`CREATE DATABASE "${config.targetDb}"`);
      console.log(`[2/6] Database '${config.targetDb}' created successfully.`);
    } else {
      console.log(`[2/6] Database '${config.targetDb}' already exists.`);
    }
  } catch (err) {
    console.error('[ERROR] Could not connect to PostgreSQL:', err.message);
    console.error('Please verify server/.env credentials (host, port, user, password).');
    process.exit(1);
  } finally {
    await maintenanceClient.end();
  }

  // Step 2: Connect directly to target database
  const targetClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.targetDb,
  });

  try {
    await targetClient.connect();
    console.log(`[3/6] Connected to target database '${config.targetDb}'.`);

    const dbDir = path.join(__dirname, '../../../database');

    // Execute schema.sql
    console.log('[4/6] Executing database/schema.sql...');
    const schemaSql = fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf-8');
    await targetClient.query(schemaSql);
    console.log('      Tables, Primary Keys, Foreign Keys, & Constraints created.');

    // Execute views.sql
    console.log('[5/6] Executing database/views.sql, functions.sql, triggers.sql...');
    const viewsSql = fs.readFileSync(path.join(dbDir, 'views.sql'), 'utf-8');
    await targetClient.query(viewsSql);

    const functionsSql = fs.readFileSync(path.join(dbDir, 'functions.sql'), 'utf-8');
    await targetClient.query(functionsSql);

    const triggersSql = fs.readFileSync(path.join(dbDir, 'triggers.sql'), 'utf-8');
    await targetClient.query(triggersSql);
    console.log('      Views, Functions, Procedures & Triggers applied.');

    // Execute seed.sql
    console.log('[6/6] Executing database/seed.sql...');
    const seedSql = fs.readFileSync(path.join(dbDir, 'seed.sql'), 'utf-8');
    await targetClient.query(seedSql);
    console.log('      Synthetic realistic demo records seeded successfully.');

    console.log('====================================================');
    console.log(' DATABASE INITIALIZATION COMPLETE!');
    console.log(' Demo Login Accounts:');
    console.log('   Admin        : username = admin       | password = Admin@123');
    console.log('   Doctor       : username = dr.sarah   | password = Doctor@123');
    console.log('   Receptionist : username = receptionist | password = Staff@123');
    console.log('====================================================');
  } catch (err) {
    console.error('[ERROR] Execution failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await targetClient.end();
  }
};

runInit();
