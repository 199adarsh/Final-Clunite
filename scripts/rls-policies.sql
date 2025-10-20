-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view published clubs" ON clubs;
DROP POLICY IF EXISTS "Organizers can create clubs" ON clubs;
DROP POLICY IF EXISTS "Club creators can update their clubs" ON clubs;
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Organizers can create events" ON events;
DROP POLICY IF EXISTS "Event creators can update their events" ON events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON events;
DROP POLICY IF EXISTS "Users can view memberships" ON club_memberships;
DROP POLICY IF EXISTS "Users can join clubs" ON club_memberships;
DROP POLICY IF EXISTS "Users can leave clubs" ON club_memberships;
DROP POLICY IF EXISTS "Users can view their registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their registrations" ON event_registrations;
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow all operations" ON clubs;
DROP POLICY IF EXISTS "Allow all operations" ON events;
DROP POLICY IF EXISTS "Allow all operations" ON club_memberships;
DROP POLICY IF EXISTS "Allow all operations" ON event_registrations;

-- DISABLE RLS on all tables (for development without authentication)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
