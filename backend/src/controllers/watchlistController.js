import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get user's watchlist
export async function getWatchlist(req, res, next) {
  try {
    const userId = req.userId;

    const [items] = await pool.execute(
      'SELECT * FROM watchlist WHERE user_id = ? ORDER BY added_at DESC',
      [userId]
    );

    res.json(items.map(item => ({
      id: item.id,
      titleId: item.title_id,
      addedAt: item.added_at
    })));
  } catch (error) {
    next(error);
  }
}

// Add to watchlist
export async function addToWatchlist(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.body;

    if (!titleId) {
      return res.status(400).json({ error: 'titleId is required' });
    }

    const watchlistId = uuidv4();

    try {
      await pool.execute(
        'INSERT INTO watchlist (id, user_id, title_id) VALUES (?, ?, ?)',
        [watchlistId, userId, titleId]
      );
    } catch (error) {
      // If duplicate entry, return success anyway
      if (error.code === 'ER_DUP_ENTRY') {
        return res.json({ success: true, message: 'Already in watchlist' });
      }
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Remove from watchlist
export async function removeFromWatchlist(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.params;

    await pool.execute(
      'DELETE FROM watchlist WHERE user_id = ? AND title_id = ?',
      [userId, titleId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
