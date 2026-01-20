import express from 'express';
import {
  getAdSettings,
  updateAdSettings,
  getAdVideos,
  getActiveAdVideos,
  addAdVideo,
  updateAdVideo,
  deleteAdVideo,
  trackImpression
} from '../controllers/adsController.js';
import { authenticateJWT, optionalAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Public routes
router.get('/settings', getAdSettings);
router.get('/videos/active', getActiveAdVideos);
router.post('/impressions', optionalAuth, trackImpression);

// Admin routes
router.put('/settings', authenticateJWT, requireAdmin, updateAdSettings);
router.get('/videos', authenticateJWT, requireAdmin, getAdVideos);
router.post('/videos', authenticateJWT, requireAdmin, addAdVideo);
router.put('/videos/:id', authenticateJWT, requireAdmin, updateAdVideo);
router.delete('/videos/:id', authenticateJWT, requireAdmin, deleteAdVideo);

export default router;
