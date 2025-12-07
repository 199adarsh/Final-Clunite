-- Create pending_clubs table for club PIN verification
CREATE TABLE IF NOT EXISTS pending_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  pin VARCHAR(8) NOT NULL,
  official_email VARCHAR(255) NOT NULL,
  president_name VARCHAR(255),
  president_email VARCHAR(255),
  president_phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_pending_clubs_club_id ON pending_clubs(club_id);
CREATE INDEX idx_pending_clubs_pin ON pending_clubs(pin);
CREATE INDEX idx_pending_clubs_status ON pending_clubs(status);

-- Add RLS policies
ALTER TABLE pending_clubs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert
CREATE POLICY "Users can create pending clubs"
  ON pending_clubs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own pending clubs
CREATE POLICY "Users can read their pending clubs"
  ON pending_clubs FOR SELECT
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM clubs WHERE created_by = auth.uid()
    )
  );

-- Allow users to update their own pending clubs
CREATE POLICY "Users can update their pending clubs"
  ON pending_clubs FOR UPDATE
  TO authenticated
  USING (
    club_id IN (
      SELECT id FROM clubs WHERE created_by = auth.uid()
    )
  );
