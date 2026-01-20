import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Database connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: isProduction ? 20 : 10,
  queueLimit: 0,
  connectTimeout: 30000, // 30 seconds for cloud databases
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// SSL configuration for Aiven and other cloud databases
// Aiven requires SSL - set DB_SSL=true in your .env
if (process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('aiven')) {
  // Check if CA certificate file exists
  const caPath = process.env.DB_SSL_CA || path.join(__dirname, '../../certs/ca.pem');
  
  if (process.env.DB_SSL_CA && fs.existsSync(process.env.DB_SSL_CA)) {
    // Use provided CA certificate
    poolConfig.ssl = {
      ca: fs.readFileSync(process.env.DB_SSL_CA),
      rejectUnauthorized: true
    };
    console.log('🔒 Using SSL with CA certificate');
  } else if (fs.existsSync(caPath)) {
    // Use local CA certificate
    poolConfig.ssl = {
      ca: fs.readFileSync(caPath),
      rejectUnauthorized: true
    };
    console.log('🔒 Using SSL with local CA certificate');
  } else {
    // Use SSL without CA verification (for Aiven - they use trusted CAs)
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
    console.log('🔒 Using SSL (trusting server certificate)');
  }
}

const pool = mysql.createPool(poolConfig);

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.error('   Check your .env file: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    if (process.env.DB_HOST?.includes('aiven')) {
      console.error('   For Aiven: Make sure DB_SSL=true is set');
    }
    if (isProduction) {
      console.error('Exiting due to database connection failure...');
      process.exit(1);
    }
  });

export default pool;
