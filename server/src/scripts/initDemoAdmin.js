const bcrypt = require('bcryptjs');
const db = require('../config/db');

const initDemoAdmin = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hospital.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminFullName = 'System Administrator';

    console.log(`[INIT-ADMIN] Initializing demo administrator '${adminUsername}'...`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const query = `
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, 'Admin', TRUE)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
      RETURNING user_id, username, email, role;
    `;

    const res = await db.query(query, [adminUsername, adminEmail, passwordHash, adminFullName]);

    console.log('[INIT-ADMIN] Success! Demo administrator ready:');
    console.log(`  User ID  : ${res.rows[0].user_id}`);
    console.log(`  Username : ${res.rows[0].username}`);
    console.log(`  Email    : ${res.rows[0].email}`);
    console.log(`  Role     : ${res.rows[0].role}`);
    console.log(`  Password : ${adminPassword}`);
  } catch (error) {
    console.error('[INIT-ADMIN ERROR]', error.message);
  } finally {
    await db.pool.end();
  }
};

initDemoAdmin();
