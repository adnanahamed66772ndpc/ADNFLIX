import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Database connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: isProduction ? 20 : 10, // More connections in production
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Production optimizations
  ...(isProduction && {
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000,
    timezone: 'Z', // UTC timezone
  })
};

// SSL configuration for production (if using cloud databases)
if (isProduction && process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  };
}

const pool = mysql.createPool(poolConfig);

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    if (isProduction) {
      // In production, exit if database is unavailable
      console.error('Exiting due to database connection failure...');
      process.exit(1);
    }
  });

export default pool;
