-- Add optional username column (unique, for login)
ALTER TABLE users
  ADD COLUMN username VARCHAR(255) NULL UNIQUE AFTER email,
  ADD INDEX idx_username (username);
