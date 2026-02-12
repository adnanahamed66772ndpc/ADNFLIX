#!/bin/sh
set -e

# Wait for MySQL to be reachable (avoids exit on connection refused after git push deploy)
echo "Waiting for database..."
i=0
while [ $i -lt 30 ]; do
  if node -e "
    const mysql = require('mysql2/promise');
    require('dotenv').config();
    mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 3000,
    }).query('SELECT 1').then(() => process.exit(0)).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "Database ready."
    break
  fi
  i=$((i+1))
  [ $i -eq 30 ] && { echo "Database not ready after 30 attempts."; exit 1; }
  sleep 2
done

# Migrations (retry once on failure for transient errors)
echo "Running database migrations..."
for attempt in 1 2; do
  if node src/migrations/runMigrations.js; then break; fi
  [ $attempt -eq 2 ] && { echo "Migrations failed."; exit 1; }
  echo "Migrations attempt $attempt failed, retrying in 5s..."
  sleep 5
done

# Seed admin – do not exit container on failure (e.g. admin already exists)
echo "Seeding default admin (if not exists)..."
node src/migrations/seedAdmin.js || echo "Seed skipped or failed (non-fatal)."

echo "Starting server..."
exec node src/server.js
