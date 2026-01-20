import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ADNFLIX Backend API is running' });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
