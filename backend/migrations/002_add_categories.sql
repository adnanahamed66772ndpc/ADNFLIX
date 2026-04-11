-- Add categories/genres management table
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type ENUM('genre', 'category') NOT NULL DEFAULT 'genre',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default genres
INSERT INTO categories (id, name, slug, type, description) VALUES
  (UUID(), 'Action', 'action', 'genre', 'Action-packed movies and shows'),
  (UUID(), 'Adventure', 'adventure', 'genre', 'Adventure stories'),
  (UUID(), 'Comedy', 'comedy', 'genre', 'Funny and entertaining content'),
  (UUID(), 'Drama', 'drama', 'genre', 'Dramatic storytelling'),
  (UUID(), 'Horror', 'horror', 'genre', 'Scary and thrilling content'),
  (UUID(), 'Sci-Fi', 'sci-fi', 'genre', 'Science fiction content'),
  (UUID(), 'Thriller', 'thriller', 'genre', 'Suspenseful and thrilling'),
  (UUID(), 'Romance', 'romance', 'genre', 'Romantic stories'),
  (UUID(), 'Documentary', 'documentary', 'genre', 'Documentary films'),
  (UUID(), 'Animation', 'animation', 'genre', 'Animated content'),
  (UUID(), 'Crime', 'crime', 'genre', 'Crime and mystery'),
  (UUID(), 'Fantasy', 'fantasy', 'genre', 'Fantasy stories')
ON DUPLICATE KEY UPDATE name=name;
