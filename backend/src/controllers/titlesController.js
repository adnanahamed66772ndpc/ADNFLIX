import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validate audio tracks structure
 * Expected format: [{lang: 'hi', name: 'Hindi'}, {lang: 'en', name: 'English'}, ...]
 */
function validateAudioTracks(audioTracks) {
  if (!audioTracks) return true; // Optional field
  if (!Array.isArray(audioTracks)) return false;
  
  return audioTracks.every(track => 
    track && 
    typeof track === 'object' &&
    typeof track.lang === 'string' &&
    typeof track.name === 'string' &&
    track.lang.trim().length > 0 &&
    track.name.trim().length > 0
  );
}

// Get all titles
export async function getTitles(req, res, next) {
  try {
    const [titles] = await pool.execute(
      'SELECT * FROM titles ORDER BY created_at DESC'
    );

    // Fetch seasons
    const [seasons] = await pool.execute(
      'SELECT * FROM seasons ORDER BY season_number ASC'
    );

    // Fetch episodes
    const [episodes] = await pool.execute(
      'SELECT * FROM episodes ORDER BY episode_number ASC'
    );

    // Map episodes to seasons
    const seasonMap = new Map();
    seasons.forEach(s => {
      seasonMap.set(s.id, {
        id: s.id,
        seasonNumber: s.season_number,
        name: s.name,
        episodes: []
      });
    });

    episodes.forEach(e => {
      const season = seasonMap.get(e.season_id);
      if (season) {
        try {
          const audioTracks = e.audio_tracks ? JSON.parse(e.audio_tracks) : [];
          
          // Debug: Log episode data from database
          if (!e.video_url || e.video_url.trim() === '') {
            console.warn(`[getTitles] Episode "${e.name}" (ID: ${e.id}) has no video_url in database`);
          }
          
          season.episodes.push({
            id: e.id,
            episodeNumber: e.episode_number,
            name: e.name,
            synopsis: e.synopsis || null,
            duration: e.duration,
            thumbnailUrl: (e.thumbnail_url && e.thumbnail_url.trim()) || null,
            videoUrl: (e.video_url && e.video_url.trim()) || null,
            audioTracks: audioTracks.map((track, index) => ({
              id: index,
              lang: track.lang || track.language || '',
              name: track.name || track.label || '',
              url: track.url || undefined
            })),
            audio_tracks: audioTracks // Keep for backward compatibility
          });
        } catch (parseError) {
          console.warn('[getTitles] Error parsing episode audio_tracks:', parseError);
          season.episodes.push({
            id: e.id,
            episodeNumber: e.episode_number,
            name: e.name,
            synopsis: e.synopsis || null,
            duration: e.duration,
            thumbnailUrl: (e.thumbnail_url && e.thumbnail_url.trim()) || null,
            videoUrl: (e.video_url && e.video_url.trim()) || null,
            audioTracks: [],
            audio_tracks: []
          });
        }
      }
    });

    // Map seasons to titles
    const titleSeasonsMap = new Map();
    seasons.forEach(s => {
      const existing = titleSeasonsMap.get(s.title_id) || [];
      existing.push(seasonMap.get(s.id));
      titleSeasonsMap.set(s.title_id, existing);
    });

    // Format titles
    const formattedTitles = titles.map(t => {
      const parseJSON = (val) => {
        if (!val) return [];
        if (typeof val === 'string') return JSON.parse(val);
        return val;
      };
      
      return {
        id: t.id,
        type: t.type,
        name: t.name,
        synopsis: t.synopsis,
        year: t.year, // Database column is 'year'
        language: t.language,
        maturity: t.maturity,
        premium: t.premium,
        posterUrl: t.poster_url,
        backdropUrl: t.backdrop_url,
        trailerUrl: t.trailer_url,
        videoUrl: t.video_url,
        duration: t.duration,
        rating: Number(t.rating) || 0,
        genres: parseJSON(t.genres),
        cast: parseJSON(t.cast_members),
        audioTracks: parseJSON(t.audio_tracks).map((track, index) => ({
          id: index,
          lang: track.lang || track.language || '',
          name: track.name || track.label || '',
          url: track.url || undefined
        })),
        trending: t.trending,
        newRelease: t.new_release,
        createdAt: t.created_at,
        seasons: titleSeasonsMap.get(t.id) || []
      };
    });

    res.json(formattedTitles);
  } catch (error) {
    console.error('[getTitles] Error fetching titles:', error);
    next(error);
  }
}

// Get title by ID
export async function getTitleById(req, res, next) {
  try {
    const { id } = req.params;

    const [titles] = await pool.execute(
      'SELECT * FROM titles WHERE id = ?',
      [id]
    );

    if (titles.length === 0) {
      return res.status(404).json({ error: 'Title not found' });
    }

    const title = titles[0];

    // Fetch seasons and episodes
    const [seasons] = await pool.execute(
      'SELECT * FROM seasons WHERE title_id = ? ORDER BY season_number ASC',
      [id]
    );

    const seasonIds = seasons.map(s => s.id);
    const [episodes] = seasonIds.length > 0
      ? await pool.execute(
          'SELECT * FROM episodes WHERE season_id IN (?) ORDER BY episode_number ASC',
          [seasonIds]
        )
      : [[], []];

    // Map episodes to seasons
    const seasonMap = new Map();
    seasons.forEach(s => {
      seasonMap.set(s.id, {
        id: s.id,
        seasonNumber: s.season_number,
        name: s.name,
        episodes: []
      });
    });

    episodes.forEach(e => {
      const season = seasonMap.get(e.season_id);
      if (season) {
        const parseEpisodeAudioTracks = (val) => {
          if (!val) return [];
          if (typeof val === 'string') return JSON.parse(val);
          return val;
        };
        
        // Debug: Log episode data from database
        if (!e.video_url || e.video_url.trim() === '') {
          console.warn(`[getTitleById] Episode "${e.name}" (ID: ${e.id}) has no video_url in database`);
        }
        
        const audioTracks = parseEpisodeAudioTracks(e.audio_tracks).map((track, index) => ({
          id: index,
          lang: track.lang || track.language || '',
          name: track.name || track.label || '',
          url: track.url || undefined
        }));
        
        season.episodes.push({
          id: e.id,
          episodeNumber: e.episode_number,
          name: e.name,
          synopsis: e.synopsis || null,
          duration: e.duration,
          thumbnailUrl: (e.thumbnail_url && e.thumbnail_url.trim()) || null,
          videoUrl: (e.video_url && e.video_url.trim()) || null,
          audioTracks: audioTracks,
          audio_tracks: audioTracks // Keep for backward compatibility
        });
      }
    });

    const parseJSON = (val) => {
      if (!val) return [];
      if (typeof val === 'string') return JSON.parse(val);
      return val;
    };

    const formattedTitle = {
      id: title.id,
      type: title.type,
      name: title.name,
      synopsis: title.synopsis,
      year: title.year, // Database column is 'year'
      language: title.language,
      maturity: title.maturity,
      premium: title.premium,
      posterUrl: title.poster_url,
      backdropUrl: title.backdrop_url,
      trailerUrl: title.trailer_url,
      videoUrl: title.video_url,
      duration: title.duration,
      rating: Number(title.rating) || 0,
      genres: parseJSON(title.genres),
      cast: parseJSON(title.cast_members),
      audioTracks: parseJSON(title.audio_tracks).map((track, index) => ({
        id: index,
        lang: track.lang || track.language || '',
        name: track.name || track.label || '',
        url: track.url || undefined
      })),
      trending: title.trending,
      newRelease: title.new_release,
      createdAt: title.created_at,
      seasons: Array.from(seasonMap.values())
    };

    res.json(formattedTitle);
  } catch (error) {
    next(error);
  }
}

// Create title (admin only)
export async function createTitle(req, res, next) {
  try {
    const title = req.body;
    
    // Validate required fields
    if (!title.name || typeof title.name !== 'string' || title.name.trim() === '') {
      return res.status(400).json({ 
        error: 'Title name is required and must be a non-empty string.' 
      });
    }
    
    if (!title.type || (title.type !== 'movie' && title.type !== 'series')) {
      return res.status(400).json({ 
        error: 'Title type is required and must be either "movie" or "series".' 
      });
    }
    
    // Validate year
    const year = parseInt(title.year, 10);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
      return res.status(400).json({ 
        error: `Invalid year. Must be a number between 1900 and ${new Date().getFullYear() + 10}.` 
      });
    }
    
    // Validate audio tracks if provided
    if (title.audioTracks !== undefined && !validateAudioTracks(title.audioTracks)) {
      return res.status(400).json({ 
        error: 'Invalid audio_tracks format. Expected array of objects with lang and name properties.' 
      });
    }
    
    const titleId = uuidv4();

    await pool.execute(
      `INSERT INTO titles (
        id, type, name, synopsis, year, language, maturity, premium,
        poster_url, backdrop_url, trailer_url, video_url, duration,
        rating, genres, cast_members, audio_tracks, trending, new_release
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titleId,
        title.type,
        title.name.trim(),
        title.synopsis || null,
        year,
        title.language || 'English',
        title.maturity || 'PG-13',
        title.premium || false,
        title.posterUrl || null,
        title.backdropUrl || null,
        title.trailerUrl || null,
        title.videoUrl || null,
        title.duration || null,
        title.rating || 0,
        JSON.stringify(title.genres || []),
        JSON.stringify(title.cast || []),
        JSON.stringify(title.audioTracks || []),
        title.trending || false,
        title.newRelease || false
      ]
    );

    res.status(201).json({ id: titleId, success: true });
  } catch (error) {
    next(error);
  }
}

// Update title (admin only)
export async function updateTitle(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate audio tracks if provided
    if (updates.audioTracks !== undefined && !validateAudioTracks(updates.audioTracks)) {
      return res.status(400).json({ 
        error: 'Invalid audio_tracks format. Expected array of objects with lang and name properties.' 
      });
    }

    const updateFields = [];
    const values = [];

    // Only update type if it's a valid value (movie or series)
    // Never allow type to be set to undefined, null, or invalid value
    if (updates.type !== undefined && (updates.type === 'movie' || updates.type === 'series')) {
      updateFields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.name !== undefined) { updateFields.push('name = ?'); values.push(updates.name); }
    if (updates.synopsis !== undefined) { updateFields.push('synopsis = ?'); values.push(updates.synopsis); }
    if (updates.year !== undefined) { updateFields.push('year = ?'); values.push(updates.year); }
    if (updates.language !== undefined) { updateFields.push('language = ?'); values.push(updates.language); }
    if (updates.maturity !== undefined) { updateFields.push('maturity = ?'); values.push(updates.maturity); }
    if (updates.premium !== undefined) { updateFields.push('premium = ?'); values.push(updates.premium); }
    if (updates.posterUrl !== undefined) { updateFields.push('poster_url = ?'); values.push(updates.posterUrl); }
    if (updates.backdropUrl !== undefined) { updateFields.push('backdrop_url = ?'); values.push(updates.backdropUrl); }
    if (updates.trailerUrl !== undefined) { updateFields.push('trailer_url = ?'); values.push(updates.trailerUrl); }
    if (updates.videoUrl !== undefined) { updateFields.push('video_url = ?'); values.push(updates.videoUrl); }
    if (updates.duration !== undefined) { updateFields.push('duration = ?'); values.push(updates.duration); }
    if (updates.rating !== undefined) { updateFields.push('rating = ?'); values.push(updates.rating); }
    if (updates.genres !== undefined) { updateFields.push('genres = ?'); values.push(JSON.stringify(updates.genres)); }
    if (updates.cast !== undefined) { updateFields.push('cast_members = ?'); values.push(JSON.stringify(updates.cast)); }
    if (updates.audioTracks !== undefined) { updateFields.push('audio_tracks = ?'); values.push(JSON.stringify(updates.audioTracks)); }
    if (updates.trending !== undefined) { updateFields.push('trending = ?'); values.push(updates.trending); }
    if (updates.newRelease !== undefined) { updateFields.push('new_release = ?'); values.push(updates.newRelease); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE titles SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Delete title (admin only)
export async function deleteTitle(req, res, next) {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM titles WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Add season (admin only)
export async function addSeason(req, res, next) {
  try {
    const { titleId } = req.params;
    const { seasonNumber, name } = req.body;

    const seasonId = uuidv4();

    await pool.execute(
      'INSERT INTO seasons (id, title_id, season_number, name) VALUES (?, ?, ?, ?)',
      [seasonId, titleId, seasonNumber, name || null]
    );

    res.status(201).json({ id: seasonId, success: true });
  } catch (error) {
    next(error);
  }
}

// Delete season (admin only)
export async function deleteSeason(req, res, next) {
  try {
    const { seasonId } = req.params;

    await pool.execute('DELETE FROM seasons WHERE id = ?', [seasonId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Add episode (admin only)
export async function addEpisode(req, res, next) {
  try {
    const { seasonId } = req.params;
    const episode = req.body;
    
    // Validate required fields
    if (!episode.name || typeof episode.name !== 'string' || episode.name.trim() === '') {
      return res.status(400).json({ 
        error: 'Episode name is required and must be a non-empty string.' 
      });
    }
    
    if (!episode.videoUrl || typeof episode.videoUrl !== 'string' || episode.videoUrl.trim() === '') {
      return res.status(400).json({ 
        error: 'Episode video URL is required. Please upload a video or provide a video URL.' 
      });
    }
    
    if (!episode.episodeNumber || typeof episode.episodeNumber !== 'number' || episode.episodeNumber < 1) {
      return res.status(400).json({ 
        error: 'Episode number is required and must be a positive number.' 
      });
    }
    
    if (!episode.duration || typeof episode.duration !== 'number' || episode.duration < 1) {
      return res.status(400).json({ 
        error: 'Episode duration is required and must be a positive number (in minutes).' 
      });
    }
    
    // Validate audio tracks if provided
    if (episode.audioTracks !== undefined && !validateAudioTracks(episode.audioTracks)) {
      return res.status(400).json({ 
        error: 'Invalid audio_tracks format. Expected array of objects with lang and name properties.' 
      });
    }

    const episodeId = uuidv4();

    await pool.execute(
      `INSERT INTO episodes (
        id, season_id, episode_number, name, synopsis, duration,
        thumbnail_url, video_url, audio_tracks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        episodeId,
        seasonId,
        episode.episodeNumber,
        episode.name.trim(),
        episode.synopsis || null,
        episode.duration,
        (episode.thumbnailUrl && episode.thumbnailUrl.trim()) || null,
        episode.videoUrl.trim(),
        JSON.stringify(episode.audioTracks || [])
      ]
    );

    res.status(201).json({ id: episodeId, success: true });
  } catch (error) {
    next(error);
  }
}

// Delete episode (admin only)
export async function deleteEpisode(req, res, next) {
  try {
    const { episodeId } = req.params;

    await pool.execute('DELETE FROM episodes WHERE id = ?', [episodeId]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
