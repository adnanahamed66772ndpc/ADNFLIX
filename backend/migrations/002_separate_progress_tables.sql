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
  
  -- Each user can only have one progress entry per movie
  UNIQUE KEY unique_user_movie (user_id, title_id),
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  
  -- Indexes for faster queries
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
  
  -- Each user can only have one progress entry per episode
  UNIQUE KEY unique_user_episode (user_id, title_id, episode_id),
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX idx_user_id (user_id),
  INDEX idx_title_id (title_id),
  INDEX idx_episode_id (episode_id),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Migrate existing data from playback_progress
-- =====================================================

-- Migrate movie progress (entries without episode_id)
INSERT IGNORE INTO movie_progress (id, user_id, title_id, progress_seconds, duration_seconds, updated_at)
SELECT 
  id,
  user_id,
  title_id,
  progress_seconds,
  COALESCE(duration_seconds, 0),
  updated_at
FROM playback_progress 
WHERE episode_id IS NULL;

-- Migrate series progress (entries with episode_id)
INSERT IGNORE INTO series_progress (id, user_id, title_id, episode_id, progress_seconds, duration_seconds, updated_at)
SELECT 
  id,
  user_id,
  title_id,
  episode_id,
  progress_seconds,
  COALESCE(duration_seconds, 0),
  updated_at
FROM playback_progress 
WHERE episode_id IS NOT NULL;

-- Note: We keep the old playback_progress table for now
-- You can drop it later after verifying the migration:
-- DROP TABLE IF EXISTS playback_progress;
