const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

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
    
    // In development: use CORS_DEV_ORIGINS env or default localhost origins
    if (!isProduction) {
      const devOrigins = process.env.CORS_DEV_ORIGINS
        ? process.env.CORS_DEV_ORIGINS.split(',').map(o => o.trim())
        : [
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

// Body parsers with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration - production ready
const crypto = require('crypto');
const SESSION_SECRET = process.env.SESSION_SECRET;
if (isProduction && (!SESSION_SECRET || SESSION_SECRET.length < 32)) {
  console.error('❌ FATAL: SESSION_SECRET must be set (min 32 characters) in production!');
  process.exit(1);
}
if (!isProduction && !SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET not set; using random secret (sessions reset on restart).');
}
app.use(session({
  secret: SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
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
    const pool = require('./config/database.js');
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (err) {
    health.database = 'disconnected';
    health.status = 'degraded';
  }
  
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// API Routes
const authRoutes = require('./routes/auth.js');
const videoRoutes = require('./routes/videos.js');
const titlesRoutes = require('./routes/titles.js');
const watchlistRoutes = require('./routes/watchlist.js');
const playbackRoutes = require('./routes/playback.js');
const transactionRoutes = require('./routes/transactions.js');
const adminRoutes = require('./routes/admin.js');
const adsRoutes = require('./routes/ads.js');
const categoriesRoutes = require('./routes/categories.js');
const ticketsRoutes = require('./routes/tickets.js');
const pagesRoutes = require('./routes/pages.js');
const configRoutes = require('./routes/config.js');
const cronRoutes = require('./routes/cron.js');

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
app.use('/api/cron', cronRoutes);

// Serve static frontend files in production (only if SERVE_FRONTEND=true)
if (isProduction && process.env.SERVE_FRONTEND === 'true') {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  
  // Only serve if frontend dist exists
  if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
    app.use(express.static(frontendPath, {
      maxAge: '1d', // Cache static assets
      etag: true
    }));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    console.log('📁 Serving frontend static files');
  }
}

// Root route - API info (all endpoints)
app.get('/', (req, res) => {
  res.json({
    name: 'ADNFLIX API',
    version: '1.0.0',
    status: 'running',
    docs: '/health',
    endpoints: {
      auth: '/api/auth',
      subscriptionCheck: '/api/auth/subscription/check',
      titles: '/api/titles',
      categories: '/api/categories',
      videos: '/api/videos',
      watchlist: '/api/watchlist',
      playback: '/api/playback',
      transactions: '/api/transactions',
      config: '/api/config',
      plans: '/api/config/plans',
      paymentMethods: '/api/config/payment-methods',
      pages: '/api/pages',
      terms: '/api/pages/terms',
      privacy: '/api/pages/privacy',
      help: '/api/pages/help',
      tickets: '/api/tickets',
      admin: '/api/admin',
      ads: '/api/ads',
      cron: '/api/cron',
      expireSubscriptions: '/api/cron/expire-subscriptions'
    },
    paymentNumbers: {
      endpoint: 'GET /api/config/payment-methods',
      auth: false,
      description: 'Payment method send-money numbers (bKash, Nagad, Rocket). Set in Admin → Settings; website and mobile fetch this endpoint so numbers stay in sync everywhere.',
      adminUpdate: 'PUT /api/admin/config/payment-methods/:id (auth: admin)'
    },
    features: {
      plans: 'Subscription plans (GET /api/config/plans or /api/config)',
      paymentNumbers: 'Payment method numbers for website & app (GET /api/config/payment-methods). Admin: PUT /api/admin/config/payment-methods/:id',
      termsAndPrivacy: 'Terms of Service, Privacy Policy (GET /api/pages). Admin: edit in Admin → Settings',
      support: 'Support tickets (GET/POST /api/tickets). Admin: view in Admin → Tickets'
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

// 404 catch-all: any request that didn't get a response (e.g. no matching route)
app.use((req, res, next) => {
  if (res.headersSent) return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'API route not found', path: req.path });
  }
  next();
});

// Start server - bind to 0.0.0.0 so reverse proxy (Nginx) can reach us in Docker
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 ADNFLIX Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
});

module.exports = app;
