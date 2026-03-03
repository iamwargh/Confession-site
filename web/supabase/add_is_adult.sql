-- Add is_adult column to confessions table
ALTER TABLE confessions ADD COLUMN is_adult BOOLEAN NOT NULL DEFAULT false;

-- Add index to help optimize filtering adult content
CREATE INDEX IF NOT EXISTS idx_confessions_is_adult ON confessions(is_adult);

-- Drop existing composite indexes that might conflict or need to be recreated? Probably not needed, just creating the individual index is fine, though we might want to include it in feed/trending indexes if performance suffers.
