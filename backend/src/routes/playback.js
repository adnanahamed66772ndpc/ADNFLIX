import express from 'express';
import {
  getPlaybackProgress,
  updatePlaybackProgress,
  getProgress,
  getMovieProgress,
  getSeriesProgress,
  deleteMovieProgress,
  deleteSeriesProgress
} from '../controllers/playbackController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Get all progress (movies + series combined)
router.get('/', authenticateJWT, getPlaybackProgress);

// Update progress (auto-detect movie vs series based on episodeId)
router.post('/', authenticateJWT, updatePlaybackProgress);

// Get progress for specific title (movie or episode)
router.get('/:titleId', authenticateJWT, getProgress);

// Movie-specific routes
router.get('/movie/:titleId', authenticateJWT, getMovieProgress);
router.delete('/movie/:titleId', authenticateJWT, deleteMovieProgress);

// Series-specific routes
router.get('/series/:titleId', authenticateJWT, getSeriesProgress);
router.delete('/series/:titleId', authenticateJWT, deleteSeriesProgress);

export default router;
