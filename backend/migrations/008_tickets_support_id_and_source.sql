-- Add unique support ID and source (web/app) to tickets
ALTER TABLE tickets ADD COLUMN support_id VARCHAR(20) UNIQUE NULL;
ALTER TABLE tickets ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'web';

-- Backfill support_id for existing rows (SUP- + first 8 chars of id)
UPDATE tickets SET support_id = CONCAT('SUP-', UPPER(SUBSTRING(id, 1, 8))) WHERE support_id IS NULL;
