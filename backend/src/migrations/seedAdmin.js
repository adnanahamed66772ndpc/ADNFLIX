const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password.js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [existing] = await pool.execute(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [ADMIN_USERNAME, ADMIN_EMAIL]
  );

  if (existing.length > 0) {
    console.log('Default admin user already exists.');
    await pool.end();
    return;
  }

  const userId = uuidv4();
  const profileId = uuidv4();
  const roleId = uuidv4();
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await pool.execute(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
    [userId, ADMIN_USERNAME, ADMIN_EMAIL, passwordHash]
  );
  await pool.execute(
    'INSERT INTO profiles (id, user_id, display_name, subscription_plan) VALUES (?, ?, ?, ?)',
    [profileId, userId, 'Admin', 'premium']
  );
  await pool.execute(
    'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
    [roleId, userId, 'admin']
  );

  console.log('Default admin user created: username=admin, password=admin123 (change after first login).');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
