const express = require('express');
const {
  getAdSettings,
  updateAdSettings,
  getAdVideos,
  getActiveAdVideos,
  addAdVideo,
  updateAdVideo,
  deleteAdVideo,
  trackImpression
} = require('../controllers/adsController.js');
const { authenticateJWT, optionalAuth } = require('../middleware/auth.js');
const { requireAdmin } = require('../middleware/roles.js');

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

module.exports = router;
