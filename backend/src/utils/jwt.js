const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// In production, JWT_SECRET is required
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT secret in production
if (isProduction && (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret' || JWT_SECRET.length < 32)) {
  console.error('❌ FATAL: JWT_SECRET must be set to a secure value (min 32 characters) in production!');
  process.exit(1);
}

// Use a development-only fallback (with warning)
const SECRET = JWT_SECRET || (() => {
  console.warn('⚠️  WARNING: Using auto-generated JWT secret. This will change on restart!');
  console.warn('⚠️  Set JWT_SECRET environment variable for persistent authentication.');
  return crypto.randomBytes(32).toString('hex');
})();

function generateToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    return null;
  }
}

function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken, decodeToken };
