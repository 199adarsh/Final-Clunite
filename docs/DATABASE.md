# Database Guide

## Schema Overview

### Tables

#### users
User profiles and authentication
- `id` (uuid, primary key)
- `email` (text)
- `full_name` (text)
- `role` (text: 'student' | 'organizer')
- `college` (text)
- `avatar_url` (text)
- `bio` (text)

#### clubs
Campus clubs and organizations
- `id` (uuid, primary key)
- `name` (text)
- `category` (text)
- `college` (text)
- `description` (text)
- `verification_status` (text)
- `created_at` (timestamp)

#### events
Campus events
- `id` (uuid, primary key)
- `title` (text)
- `description` (text)
- `club_id` (uuid, foreign key)
- `start_date` (timestamp)
- `end_date` (timestamp)
- `status` (text)
- `image_url` (text)

#### club_memberships
User-club relationships
- `user_id` (uuid, foreign key)
- `club_id` (uuid, foreign key)
- `role` (text: 'admin' | 'member')

#### event_registrations
Event registration tracking
- `user_id` (uuid, foreign key)
- `event_id` (uuid, foreign key)
- `status` (text)
- `team_name` (text, optional)

## Migrations

Run scripts in this order:
1. `init-database-v2.sql` - Core schema
2. `functions.sql` - Database functions
3. `rls-policies.sql` - Security policies
4. `seed-data-v2.sql` - Sample data (optional)

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- Users can only modify their own data
- Public read access for events/clubs
- Admin-only access for sensitive operations
