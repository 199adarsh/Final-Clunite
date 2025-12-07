-- Add branch column to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.branch IS 'Student branch/major (e.g., Computer Science, Mechanical Engineering)';

-- Optional: Create an index if you plan to filter by branch frequently
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch);
