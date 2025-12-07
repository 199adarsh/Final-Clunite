-- ============================================
-- EMERGENCY FIX: Temporarily disable RLS on pending_clubs
-- ============================================
-- This will help us debug if RLS is the issue
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS on pending_clubs to test
ALTER TABLE pending_clubs DISABLE ROW LEVEL SECURITY;

-- After you verify it works, you can re-enable it with:
-- ALTER TABLE pending_clubs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DEBUG QUERY: Check what's in pending_clubs
-- ============================================
SELECT 
  id,
  official_email,
  pin,
  status,
  club_id,
  created_by,
  club_data,
  expires_at,
  created_at
FROM pending_clubs
WHERE official_email = 'try.darshanchougule@gmail.com'
ORDER BY created_at DESC;

-- ============================================
-- If the above query shows your club, then RLS is the problem
-- ============================================
