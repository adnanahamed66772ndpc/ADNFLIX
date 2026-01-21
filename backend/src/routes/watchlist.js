const express = require('express');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController.js');
const { authenticateJWT } = require('../middleware/auth.js');

const router = express.Router();

router.get('/', authenticateJWT, getWatchlist);
router.post('/', authenticateJWT, addToWatchlist);
router.delete('/:titleId', authenticateJWT, removeFromWatchlist);

module.exports = router;
