import express from 'express';
import {
  getTitles,
  getTitleById,
  createTitle,
  updateTitle,
  deleteTitle,
  addSeason,
  deleteSeason,
  addEpisode,
  deleteEpisode
} from '../controllers/titlesController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Public routes
router.get('/', getTitles);
router.get('/:id', getTitleById);

// Admin routes
router.post('/', authenticateJWT, requireAdmin, createTitle);
router.put('/:id', authenticateJWT, requireAdmin, updateTitle);
router.delete('/:id', authenticateJWT, requireAdmin, deleteTitle);

// Season routes (admin only)
router.post('/:titleId/seasons', authenticateJWT, requireAdmin, addSeason);
router.delete('/seasons/:seasonId', authenticateJWT, requireAdmin, deleteSeason);

// Episode routes (admin only)
router.post('/seasons/:seasonId/episodes', authenticateJWT, requireAdmin, addEpisode);
router.delete('/episodes/:episodeId', authenticateJWT, requireAdmin, deleteEpisode);

export default router;
