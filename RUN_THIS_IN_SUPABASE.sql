-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This adds the missing columns for multi-use PIN tracking

-- 1. Add columns to pending_clubs table
ALTER TABLE pending_clubs 
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS first_used_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS first_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 2. Add columns to club_memberships table
ALTER TABLE club_memberships 
ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_via_pin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- 3. Create verification_logs table
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

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_club_id ON verification_logs(club_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_created_by ON pending_clubs(created_by);
CREATE INDEX IF NOT EXISTS idx_pending_clubs_first_used_by ON pending_clubs(first_used_by);
CREATE INDEX IF NOT EXISTS idx_club_memberships_is_owner ON club_memberships(is_owner);

-- 5. Disable RLS on verification_logs for development
ALTER TABLE verification_logs DISABLE ROW LEVEL SECURITY;

-- Done! You can now create clubs with the new PIN tracking system.
