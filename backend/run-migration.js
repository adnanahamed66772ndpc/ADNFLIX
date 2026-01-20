import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('🔄 Running migration: 002_separate_progress_tables.sql');
    
    const migrationPath = path.join(__dirname, 'migrations', '002_separate_progress_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 New tables created:');
    console.log('   - movie_progress (for Movies)');
    console.log('   - series_progress (for Series episodes)');
    console.log('');
    
    // Show counts
    const [movieCount] = await connection.query('SELECT COUNT(*) as count FROM movie_progress');
    const [seriesCount] = await connection.query('SELECT COUNT(*) as count FROM series_progress');
    
    console.log(`📈 Data migrated:`);
    console.log(`   - Movie progress entries: ${movieCount[0].count}`);
    console.log(`   - Series progress entries: ${seriesCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);
