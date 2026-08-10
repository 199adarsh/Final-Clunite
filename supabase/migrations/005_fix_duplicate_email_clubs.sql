-- Migration: Fix duplicate club email issue
-- This adds a UNIQUE constraint on (official_email, pin) to prevent duplicate email conflicts
-- and ensures each PIN is unique per email combination

-- Add UNIQUE constraint on official_email + pin combination
ALTER TABLE pending_clubs 
ADD CONSTRAINT unique_email_pin UNIQUE(official_email, pin);

-- Add index for faster lookups by official_email and club_data->name
CREATE INDEX IF NOT EXISTS idx_pending_clubs_email_name 
ON pending_clubs(official_email, (club_data->>'name'));

-- Add comment
COMMENT ON CONSTRAINT unique_email_pin ON pending_clubs 
IS 'Ensures each PIN is unique per email, preventing duplicate email conflicts';
