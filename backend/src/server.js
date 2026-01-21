import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy in production (for correct protocol detection behind reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// CORS Configuration - Dynamic for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // In production, allow same-origin and configured origins
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : [];
    
    // Allow localhost in development
    if (!isProduction) {
      const devOrigins = [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];
      allowedOrigins.push(...devOrigins);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // In production with no specific origins, allow same-origin
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
};

app.use(cors(corsOptions));

// Security middleware using Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for video streaming compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow video/image loading
}));

// Rate limiting - protect against abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit requests per IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for video/audio streaming
    return req.path.startsWith('/api/videos/') || req.path.includes('/audio/');
  }
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 100, // 10 attempts per 15 min in production
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsers with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration - production ready
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret_in_production',
  name: 'adnflix.sid', // Custom session cookie name
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isProduction ? 'strict' : 'lax'
  }
}));

// Health check endpoint - production ready
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: isProduction ? 'production' : 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  // Optional: Check database connectivity
  try {
    const pool = (await import('./config/database.js')).default;
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (err) {
    health.database = 'disconnected';
    health.status = 'degraded';
  }
  
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// API Routes
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import titlesRoutes from './routes/titles.js';
import watchlistRoutes from './routes/watchlist.js';
import playbackRoutes from './routes/playback.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';
import adsRoutes from './routes/ads.js';
import categoriesRoutes from './routes/categories.js';
import ticketsRoutes from './routes/tickets.js';
import pagesRoutes from './routes/pages.js';
import configRoutes from './routes/config.js';

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/titles', titlesRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/playback', playbackRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/config', configRoutes);

// Serve static frontend files in production (only if SERVE_FRONTEND=true)
// For API-only deployment (Render), set SERVE_FRONTEND=false or leave unset
if (isProduction && process.env.SERVE_FRONTEND === 'true') {
  const frontendPath = join(__dirname, '../../frontend/dist');
  const fs = await import('fs');
  
  // Only serve if frontend dist exists
  if (fs.existsSync(join(frontendPath, 'index.html'))) {
    app.use(express.static(frontendPath, {
      maxAge: '1d', // Cache static assets
      etag: true
    }));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(join(frontendPath, 'index.html'));
    });
    console.log('📁 Serving frontend static files');
  }
}

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'ADNFLIX API',
    version: '1.0.0',
    status: 'running',
    docs: '/health',
    endpoints: {
      auth: '/api/auth',
      titles: '/api/titles',
      categories: '/api/categories',
      videos: '/api/videos',
      watchlist: '/api/watchlist',
      playback: '/api/playback'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Start server - cPanel/LiteSpeed compatible
// Let cPanel inject PORT, don't force HOST binding
app.listen(PORT, () => {
  console.log(`🚀 ADNFLIX Server running on port ${PORT}`);
  console.log(`📍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
});

export default app;
