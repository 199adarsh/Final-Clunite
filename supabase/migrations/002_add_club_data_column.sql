-- Migration: Add club_data JSONB column to pending_clubs
-- This stores club information before PIN verification

-- Add club_data column to store club information as JSON
ALTER TABLE pending_clubs 
ADD COLUMN IF NOT EXISTS club_data JSONB;

-- Remove the club_id foreign key constraint since we're storing data before club creation
ALTER TABLE pending_clubs 
DROP CONSTRAINT IF EXISTS pending_clubs_club_id_fkey;

-- Make club_id nullable since club doesn't exist yet
ALTER TABLE pending_clubs 
ALTER COLUMN club_id DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN pending_clubs.club_data IS 'Stores club information (name, description, etc.) before PIN verification';

-- Update RLS policies to allow users to read their own pending clubs by created_by
DROP POLICY IF EXISTS "Users can read their pending clubs" ON pending_clubs;
CREATE POLICY "Users can read their pending clubs"
  ON pending_clubs FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their pending clubs" ON pending_clubs;
CREATE POLICY "Users can update their pending clubs"
  ON pending_clubs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());
