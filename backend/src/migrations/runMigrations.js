const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const migrationsDir = path.join(__dirname, '../../migrations');

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('Running:', file);
    try {
      await pool.query(sql);
      console.log('OK:', file);
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      // Idempotent: already applied migrations (e.g. re-deploy)
      if (msg.includes('duplicate column') || msg.includes('duplicate key') || msg.includes('already exists')) {
        console.log('Skip (already applied):', file);
      } else {
        throw err;
      }
    }
  }

  await pool.end();
  console.log('Migrations done.');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
