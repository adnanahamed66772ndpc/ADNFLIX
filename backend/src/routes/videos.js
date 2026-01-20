import express from 'express';
import { uploadVideo, serveVideo, deleteVideo, listVideos, uploadAudio, serveAudio } from '../controllers/videoController.js';
import { uploadVideo as uploadMiddleware } from '../middleware/upload.js';
import { uploadSingleAudio } from '../middleware/audioUpload.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

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

export default router;
