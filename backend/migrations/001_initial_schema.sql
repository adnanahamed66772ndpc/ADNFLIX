-- ADNFLIX MySQL Database Schema
-- Converted from Supabase PostgreSQL schema

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS adnflix;
-- USE adnflix;

-- Create users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  subscription_plan ENUM('free', 'with-ads', 'premium') NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('admin', 'user') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create titles table
CREATE TABLE IF NOT EXISTS titles (
  id CHAR(36) PRIMARY KEY,
  type ENUM('movie', 'series') NOT NULL,
  name VARCHAR(255) NOT NULL,
  synopsis TEXT,
  year INT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'English',
  maturity VARCHAR(10) NOT NULL DEFAULT 'PG-13',
  premium BOOLEAN NOT NULL DEFAULT FALSE,
  poster_url TEXT,
  backdrop_url TEXT,
  trailer_url TEXT,
  video_url TEXT,
  duration INT,
  rating DECIMAL(3,1) DEFAULT 0,
  genres JSON NOT NULL,
  cast_members JSON NOT NULL,
  audio_tracks JSON,
  trending BOOLEAN NOT NULL DEFAULT FALSE,
  new_release BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_trending (trending),
  INDEX idx_new_release (new_release),
  INDEX idx_premium (premium)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id CHAR(36) PRIMARY KEY,
  title_id CHAR(36) NOT NULL,
  season_number INT NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_title_season (title_id, season_number),
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  INDEX idx_title_id (title_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id CHAR(36) PRIMARY KEY,
  season_id CHAR(36) NOT NULL,
  episode_number INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  synopsis TEXT,
  duration INT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  audio_tracks JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_season_episode (season_id, episode_number),
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  INDEX idx_season_id (season_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title_id CHAR(36) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_title (user_id, title_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_title_id (title_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create playback_progress table
CREATE TABLE IF NOT EXISTS playback_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title_id CHAR(36) NOT NULL,
  episode_id CHAR(36),
  progress_seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_seconds DECIMAL(10,2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_title_episode (user_id, title_id, episode_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_title_id (title_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  sender_number VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  processed_at TIMESTAMP NULL,
  processed_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_settings table
CREATE TABLE IF NOT EXISTS ad_settings (
  id CHAR(36) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  pre_roll_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mid_roll_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  post_roll_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mid_roll_interval_minutes INT NOT NULL DEFAULT 10,
  min_video_duration_for_midroll INT NOT NULL DEFAULT 300,
  ad_duration_seconds INT NOT NULL DEFAULT 15,
  skip_after_seconds INT NOT NULL DEFAULT 5,
  ad_source ENUM('custom', 'vast', 'vmap') NOT NULL DEFAULT 'custom',
  vast_pre_roll_tag TEXT,
  vast_mid_roll_tag TEXT,
  vast_post_roll_tag TEXT,
  vmap_url TEXT,
  fallback_to_custom BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_videos table
CREATE TABLE IF NOT EXISTS ad_videos (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  video_url TEXT NOT NULL,
  type ENUM('pre_roll', 'mid_roll', 'post_roll') NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  click_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
  id CHAR(36) PRIMARY KEY,
  ad_id CHAR(36),
  user_id CHAR(36),
  title_id CHAR(36),
  impression_type ENUM('view', 'skip', 'click', 'complete') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES ad_videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ad_id (ad_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default ad settings
INSERT INTO ad_settings (id) 
VALUES (UUID()) 
ON DUPLICATE KEY UPDATE id=id;
