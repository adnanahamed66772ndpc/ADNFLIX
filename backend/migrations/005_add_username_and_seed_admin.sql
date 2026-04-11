-- Add optional username column (unique, for login) - idempotent
SET @db = DATABASE();
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');
SET @sql = IF(@exists = 0,
  'ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL UNIQUE AFTER email, ADD INDEX idx_username (username)',
  'SELECT 1 AS noop');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
