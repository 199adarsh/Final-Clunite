-- Migration: Add views column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

COMMENT ON COLUMN events.views IS 'Tracks the number of times this event has been viewed';
