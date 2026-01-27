-- Migration: Separate progress tables for Movies and Series
-- Movies and Series have different structures:
-- - Movies: Single video file (no episode_id needed)
-- - Series: Multiple episodes (episode_id required)

-- =====================================================
-- Create movie_progress table (for Movies only)
-- =====================================================
CREATE TABLE IF NOT EXISTS movie_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title_id CHAR(36) NOT NULL,
  progress_seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_movie (user_id, title_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_title_id (title_id),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Create series_progress table (for Series episodes only)
-- =====================================================
CREATE TABLE IF NOT EXISTS series_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title_id CHAR(36) NOT NULL,
  episode_id CHAR(36) NOT NULL,
  progress_seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_episode (user_id, title_id, episode_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_title_id (title_id),
  INDEX idx_episode_id (episode_id),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing data from playback_progress (if table exists)
INSERT IGNORE INTO movie_progress (id, user_id, title_id, progress_seconds, duration_seconds, updated_at)
SELECT id, user_id, title_id, progress_seconds, COALESCE(duration_seconds, 0), updated_at
FROM playback_progress
WHERE episode_id IS NULL;

INSERT IGNORE INTO series_progress (id, user_id, title_id, episode_id, progress_seconds, duration_seconds, updated_at)
SELECT id, user_id, title_id, episode_id, progress_seconds, COALESCE(duration_seconds, 0), updated_at
FROM playback_progress
WHERE episode_id IS NOT NULL;
