#!/bin/sh
set -e
echo "Running database migrations..."
node src/migrations/runMigrations.js
echo "Seeding default admin (if not exists)..."
node src/migrations/seedAdmin.js
echo "Starting server..."
exec node src/server.js
