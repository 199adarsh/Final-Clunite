-- Migration: Add PIN tracking and multi-use support
-- This enables multiple users to verify with same PIN (max 5, within 48 hours)

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
