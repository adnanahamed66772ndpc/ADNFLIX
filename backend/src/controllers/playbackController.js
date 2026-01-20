import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// Get all user's playback progress (movies + series)
// =====================================================
export async function getPlaybackProgress(req, res, next) {
  try {
    const userId = req.userId;

    // Get movie progress
    const [movieProgress] = await pool.execute(
      'SELECT * FROM movie_progress WHERE user_id = ?',
      [userId]
    );

    // Get series progress
    const [seriesProgress] = await pool.execute(
      'SELECT * FROM series_progress WHERE user_id = ?',
      [userId]
    );

    // Combine and format results
    const allProgress = [
      // Movies (no episodeId)
      ...movieProgress.map(p => ({
        titleId: p.title_id,
        episodeId: undefined,
        progressSeconds: Number(p.progress_seconds),
        durationSeconds: Number(p.duration_seconds) || 0,
        updatedAt: p.updated_at,
        type: 'movie'
      })),
      // Series (with episodeId)
      ...seriesProgress.map(p => ({
        titleId: p.title_id,
        episodeId: p.episode_id,
        progressSeconds: Number(p.progress_seconds),
        durationSeconds: Number(p.duration_seconds) || 0,
        updatedAt: p.updated_at,
        type: 'series'
      }))
    ];

    res.json(allProgress);
  } catch (error) {
    next(error);
  }
}

// =====================================================
// Update playback progress (auto-detect movie vs series)
// =====================================================
export async function updatePlaybackProgress(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId, episodeId, progressSeconds, durationSeconds } = req.body;

    if (!titleId || typeof progressSeconds !== 'number') {
      return res.status(400).json({ error: 'titleId and progressSeconds are required' });
    }

    if (episodeId) {
      // SERIES: Save to series_progress table
      await pool.execute(
        `INSERT INTO series_progress (
          id, user_id, title_id, episode_id, progress_seconds, duration_seconds
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          progress_seconds = VALUES(progress_seconds),
          duration_seconds = VALUES(duration_seconds),
          updated_at = CURRENT_TIMESTAMP`,
        [
          uuidv4(),
          userId,
          titleId,
          episodeId,
          progressSeconds,
          durationSeconds || 0
        ]
      );
      
      console.log(`📺 Series progress saved: User=${userId}, Title=${titleId}, Episode=${episodeId}, Progress=${progressSeconds}s`);
    } else {
      // MOVIE: Save to movie_progress table
      await pool.execute(
        `INSERT INTO movie_progress (
          id, user_id, title_id, progress_seconds, duration_seconds
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          progress_seconds = VALUES(progress_seconds),
          duration_seconds = VALUES(duration_seconds),
          updated_at = CURRENT_TIMESTAMP`,
        [
          uuidv4(),
          userId,
          titleId,
          progressSeconds,
          durationSeconds || 0
        ]
      );
      
      console.log(`🎬 Movie progress saved: User=${userId}, Title=${titleId}, Progress=${progressSeconds}s`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    next(error);
  }
}

// =====================================================
// Get progress for specific title/episode
// =====================================================
export async function getProgress(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.params;
    const { episodeId } = req.query;

    let progress;

    if (episodeId) {
      // SERIES: Get from series_progress table
      const [rows] = await pool.execute(
        'SELECT * FROM series_progress WHERE user_id = ? AND title_id = ? AND episode_id = ?',
        [userId, titleId, episodeId]
      );
      progress = rows[0];
    } else {
      // MOVIE: Get from movie_progress table
      const [rows] = await pool.execute(
        'SELECT * FROM movie_progress WHERE user_id = ? AND title_id = ?',
        [userId, titleId]
      );
      progress = rows[0];
    }

    if (!progress) {
      return res.json(null);
    }

    res.json({
      titleId: progress.title_id,
      episodeId: progress.episode_id || undefined,
      progressSeconds: Number(progress.progress_seconds),
      durationSeconds: Number(progress.duration_seconds) || 0,
      updatedAt: progress.updated_at
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// Get movie progress only
// =====================================================
export async function getMovieProgress(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM movie_progress WHERE user_id = ? AND title_id = ?',
      [userId, titleId]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    const p = rows[0];
    res.json({
      titleId: p.title_id,
      progressSeconds: Number(p.progress_seconds),
      durationSeconds: Number(p.duration_seconds) || 0,
      updatedAt: p.updated_at,
      type: 'movie'
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// Get series progress (all episodes for a series)
// =====================================================
export async function getSeriesProgress(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM series_progress WHERE user_id = ? AND title_id = ? ORDER BY updated_at DESC',
      [userId, titleId]
    );

    res.json(rows.map(p => ({
      titleId: p.title_id,
      episodeId: p.episode_id,
      progressSeconds: Number(p.progress_seconds),
      durationSeconds: Number(p.duration_seconds) || 0,
      updatedAt: p.updated_at,
      type: 'series'
    })));
  } catch (error) {
    next(error);
  }
}

// =====================================================
// Delete movie progress (for "Remove from Continue Watching")
// =====================================================
export async function deleteMovieProgress(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.params;

    await pool.execute(
      'DELETE FROM movie_progress WHERE user_id = ? AND title_id = ?',
      [userId, titleId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// Delete series progress (all episodes or specific episode)
// =====================================================
export async function deleteSeriesProgress(req, res, next) {
  try {
    const userId = req.userId;
    const { titleId } = req.params;
    const { episodeId } = req.query;

    if (episodeId) {
      // Delete specific episode progress
      await pool.execute(
        'DELETE FROM series_progress WHERE user_id = ? AND title_id = ? AND episode_id = ?',
        [userId, titleId, episodeId]
      );
    } else {
      // Delete all episode progress for this series
      await pool.execute(
        'DELETE FROM series_progress WHERE user_id = ? AND title_id = ?',
        [userId, titleId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
