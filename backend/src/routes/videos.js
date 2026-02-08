const express = require('express');
const { uploadVideo, serveVideo, deleteVideo, listVideos, uploadAudio, serveAudio } = require('../controllers/videoController.js');
const { uploadVideo: uploadMiddleware } = require('../middleware/upload.js');
const { uploadSingleAudio } = require('../middleware/audioUpload.js');
const { authenticateJWT } = require('../middleware/auth.js');
const { requireAdmin } = require('../middleware/roles.js');

const router = express.Router();

// Upload video (admin only)
router.post('/upload', authenticateJWT, requireAdmin, uploadMiddleware, uploadVideo);

// Serve video (public, but can be restricted if needed)
router.get('/:filename', serveVideo);

// Delete video (admin only)
router.delete('/:filename', authenticateJWT, requireAdmin, deleteVideo);

// List videos (admin only)
router.get('/', authenticateJWT, requireAdmin, listVideos);

// Audio file routes
router.post('/audio/upload', authenticateJWT, requireAdmin, uploadSingleAudio, uploadAudio);
router.get('/audio/:filename', serveAudio);

module.exports = router;
