-- ============================================
-- CRITICAL: RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This fixes the club creation and verification issues
-- Run this entire file at once in Supabase SQL Editor

-- ============================================
-- MIGRATION 1: Add PIN tracking and multi-use support
-- ============================================

-- Add PIN tracking columns to pending_clubs
ALTER TABLE pending_clubs 
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS first_used_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS first_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add owner and verification tracking to club_memberships
ALTER TABLE club_memberships 
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_via_pin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- Create verification logs table for audit trail
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_used VARCHAR(8) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  CONSTRAINT unique_user_club_verification UNIQUE(user_id, club_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_club_id ON verification_logs(club_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verified_at ON verification_logs(verified_at);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_created_by ON pending_clubs(created_by);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_first_used_by ON pending_clubs(first_used_by);
CREATE INDEX IF NOT EXISTS idx_club_memberships_is_owner ON club_memberships(is_owner);

-- Disable RLS on verification_logs for development
ALTER TABLE verification_logs DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON COLUMN pending_clubs.used_count IS 'Number of times PIN has been used';
COMMENT ON COLUMN pending_clubs.max_uses IS 'Maximum number of times PIN can be used (default 5)';
COMMENT ON COLUMN pending_clubs.first_used_by IS 'User who first verified with this PIN (becomes owner)';
COMMENT ON COLUMN pending_clubs.created_by IS 'User who created the club';
COMMENT ON COLUMN club_memberships.is_owner IS 'True if user is the club owner (first to verify)';
COMMENT ON COLUMN club_memberships.verified_via_pin IS 'True if user joined via PIN verification';
COMMENT ON TABLE verification_logs IS 'Audit log of all club verifications';

-- ============================================
-- MIGRATION 2: Add club_data JSONB column
-- ============================================

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

-- ============================================
-- CRITICAL FIX: Update RLS policies
-- ============================================
-- This is the KEY fix - allows users to read pending clubs by created_by
-- instead of club_id (which is NULL for new clubs)

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

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after the migration to verify it worked:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'pending_clubs'
-- ORDER BY ordinal_position;
