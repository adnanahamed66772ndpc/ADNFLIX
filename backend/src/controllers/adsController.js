const pool = require('../config/database.js');
const { v4: uuidv4  } = require('uuid');

// Get ad settings
async function getAdSettings(req, res, next) {
  try {
    const [settings] = await pool.execute(
      'SELECT * FROM ad_settings LIMIT 1'
    );

    if (settings.length === 0) {
      // Create default settings
      const defaultId = uuidv4();
      await pool.execute(
        `INSERT INTO ad_settings (id) VALUES (?)`,
        [defaultId]
      );
      const [newSettings] = await pool.execute(
        'SELECT * FROM ad_settings WHERE id = ?',
        [defaultId]
      );
      return res.json(formatAdSettings(newSettings[0]));
    }

    res.json(formatAdSettings(settings[0]));
  } catch (error) {
    next(error);
  }
}

// Update ad settings (admin only)
async function updateAdSettings(req, res, next) {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const updateFields = [];
    const values = [];

    const fieldMap = {
      enabled: 'enabled',
      preRollEnabled: 'pre_roll_enabled',
      midRollEnabled: 'mid_roll_enabled',
      postRollEnabled: 'post_roll_enabled',
      midRollIntervalMinutes: 'mid_roll_interval_minutes',
      minVideoDurationForMidroll: 'min_video_duration_for_midroll',
      adDurationSeconds: 'ad_duration_seconds',
      skipAfterSeconds: 'skip_after_seconds',
      adSource: 'ad_source',
      vastPreRollTag: 'vast_pre_roll_tag',
      vastMidRollTag: 'vast_mid_roll_tag',
      vastPostRollTag: 'vast_post_roll_tag',
      vmapUrl: 'vmap_url',
      fallbackToCustom: 'fallback_to_custom'
    };

    Object.keys(updates).forEach(key => {
      if (fieldMap[key] !== undefined) {
        updateFields.push(`${fieldMap[key]} = ?`);
        // Handle null/undefined values properly
        let value = updates[key];
        
        // Convert boolean values to 0/1 for MySQL compatibility
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        // Convert null/undefined to null
        else if (value === undefined) {
          value = null;
        }
        
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    // Get or create settings
    const [existing] = await pool.execute('SELECT id FROM ad_settings LIMIT 1');
    let settingsId;

    if (existing.length === 0) {
      settingsId = uuidv4();
      await pool.execute('INSERT INTO ad_settings (id) VALUES (?)', [settingsId]);
    } else {
      settingsId = existing[0].id;
    }

    values.push(settingsId);

    await pool.execute(
      `UPDATE ad_settings SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[updateAdSettings] Error:', error);
    console.error('[updateAdSettings] Request body:', req.body);
    next(error);
  }
}

// Get ad videos
async function getAdVideos(req, res, next) {
  try {
    const [videos] = await pool.execute(
      'SELECT * FROM ad_videos ORDER BY created_at DESC'
    );

    res.json(videos.map(v => ({
      id: v.id,
      name: v.name,
      videoUrl: v.video_url,
      type: v.type,
      active: v.active,
      clickUrl: v.click_url,
      createdAt: v.created_at
    })));
  } catch (error) {
    next(error);
  }
}

// Get active ad videos
async function getActiveAdVideos(req, res, next) {
  try {
    const [videos] = await pool.execute(
      'SELECT * FROM ad_videos WHERE active = true ORDER BY created_at DESC'
    );

    res.json(videos.map(v => ({
      id: v.id,
      name: v.name,
      videoUrl: v.video_url,
      type: v.type,
      active: v.active,
      clickUrl: v.click_url,
      createdAt: v.created_at
    })));
  } catch (error) {
    next(error);
  }
}

// Add ad video (admin only)
async function addAdVideo(req, res, next) {
  try {
    const video = req.body;
    const videoId = uuidv4();

    await pool.execute(
      `INSERT INTO ad_videos (
        id, name, video_url, type, active, click_url
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        videoId,
        video.name,
        video.videoUrl,
        video.type,
        video.active !== undefined ? video.active : true,
        video.clickUrl || null
      ]
    );

    res.status(201).json({ id: videoId, success: true });
  } catch (error) {
    next(error);
  }
}

// Update ad video (admin only)
async function updateAdVideo(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];

    if (updates.name !== undefined) { updateFields.push('name = ?'); values.push(updates.name); }
    if (updates.videoUrl !== undefined) { updateFields.push('video_url = ?'); values.push(updates.videoUrl); }
    if (updates.type !== undefined) { updateFields.push('type = ?'); values.push(updates.type); }
    if (updates.active !== undefined) { updateFields.push('active = ?'); values.push(updates.active); }
    if (updates.clickUrl !== undefined) { updateFields.push('click_url = ?'); values.push(updates.clickUrl); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE ad_videos SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Delete ad video (admin only)
async function deleteAdVideo(req, res, next) {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM ad_videos WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Track ad impression
async function trackImpression(req, res, next) {
  try {
    const { adId, impressionType, titleId } = req.body;
    const userId = req.userId || null;

    const impressionId = uuidv4();

    await pool.execute(
      `INSERT INTO ad_impressions (
        id, ad_id, user_id, title_id, impression_type
      ) VALUES (?, ?, ?, ?, ?)`,
      [impressionId, adId, userId, titleId || null, impressionType]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

function formatAdSettings(settings) {
  return {
    id: settings.id,
    enabled: settings.enabled,
    preRollEnabled: settings.pre_roll_enabled,
    midRollEnabled: settings.mid_roll_enabled,
    postRollEnabled: settings.post_roll_enabled,
    midRollIntervalMinutes: settings.mid_roll_interval_minutes,
    minVideoDurationForMidroll: settings.min_video_duration_for_midroll,
    adDurationSeconds: settings.ad_duration_seconds,
    skipAfterSeconds: settings.skip_after_seconds,
    adSource: settings.ad_source,
    vastPreRollTag: settings.vast_pre_roll_tag,
    vastMidRollTag: settings.vast_mid_roll_tag,
    vastPostRollTag: settings.vast_post_roll_tag,
    vmapUrl: settings.vmap_url,
    fallbackToCustom: settings.fallback_to_custom,
    createdAt: settings.created_at,
    updatedAt: settings.updated_at
  };
}


module.exports = { getAdSettings, updateAdSettings, getAdVideos, getActiveAdVideos, addAdVideo, updateAdVideo, deleteAdVideo, trackImpression, formatAdSettings };
