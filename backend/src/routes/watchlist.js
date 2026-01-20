import express from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlistController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateJWT, getWatchlist);
router.post('/', authenticateJWT, addToWatchlist);
router.delete('/:titleId', authenticateJWT, removeFromWatchlist);

export default router;
