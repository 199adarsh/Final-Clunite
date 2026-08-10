-- Migration: Database Fixes
-- Description: Creates club_access_otps table, adds type to event_expenses, alters credibility_score DECIMAL precision, creates pending_clubs_public view, and implements atomic RPCs for verification and registration.

-- 1. Add type column to event_expenses
ALTER TABLE public.event_expenses 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')) DEFAULT 'expense';

-- 2. Create club_access_otps table
CREATE TABLE IF NOT EXISTS public.club_access_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  sent_to_email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on club_access_otps for development
ALTER TABLE public.club_access_otps DISABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_access_otps_club_id ON public.club_access_otps(club_id);
CREATE INDEX IF NOT EXISTS idx_club_access_otps_code ON public.club_access_otps(code);
CREATE INDEX IF NOT EXISTS idx_club_access_otps_status ON public.club_access_otps(status);

-- 3. Alter credibility_score decimal type to avoid numeric overflow
ALTER TABLE public.clubs ALTER COLUMN credibility_score TYPE DECIMAL(4,2);

-- 4. Create public view pending_clubs_public that hides the pin column
CREATE OR REPLACE VIEW public.pending_clubs_public AS
SELECT id, status, expires_at, created_by, created_at, club_data, official_email
FROM public.pending_clubs;

-- 5. Stored Procedure for server-side verify and create club
CREATE OR REPLACE FUNCTION public.verify_and_create_club(
  p_pending_club_id UUID,
  p_user_id UUID,
  p_banner_url TEXT,
  p_pin VARCHAR(8)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pending RECORD;
  v_club_id UUID;
  v_result JSONB;
BEGIN
  -- Get and lock the pending club
  SELECT * INTO v_pending 
  FROM public.pending_clubs 
  WHERE id = p_pending_club_id AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending club not found or already verified';
  END IF;
  
  -- Verify PIN
  IF v_pending.pin <> p_pin THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;
  
  -- Check expiration
  IF v_pending.expires_at < NOW() THEN
    RAISE EXCEPTION 'Verification PIN has expired';
  END IF;
  
  -- Create the club
  INSERT INTO public.clubs (
    name, tagline, description, vision, category, college, 
    founding_date, contact_email, faculty_in_charge, banner_url,
    is_verified, created_by, members_count, events_hosted_count, credibility_score
  )
  VALUES (
    v_pending.club_data->>'name',
    v_pending.club_data->>'tagline',
    v_pending.club_data->>'description',
    v_pending.club_data->>'vision',
    v_pending.club_data->>'category',
    v_pending.club_data->>'college',
    CASE WHEN v_pending.club_data->>'founding_date' IS NOT NULL AND v_pending.club_data->>'founding_date' <> '' THEN (v_pending.club_data->>'founding_date')::DATE ELSE NULL END,
    v_pending.club_data->>'contact_email',
    v_pending.club_data->>'faculty_in_charge',
    p_banner_url,
    TRUE,
    p_user_id,
    1,
    0,
    0.0
  )
  RETURNING id INTO v_club_id;
  
  -- Add owner membership
  INSERT INTO public.club_memberships (user_id, club_id, role, is_owner, verified_via_pin)
  VALUES (p_user_id, v_club_id, 'admin', TRUE, TRUE);
  
  -- Update pending_clubs status
  UPDATE public.pending_clubs 
  SET status = 'verified',
      club_id = v_club_id,
      used_count = used_count + 1,
      first_used_by = p_user_id,
      first_used_at = NOW()
  WHERE id = p_pending_club_id;
  
  -- Update user role
  UPDATE public.users 
  SET role = 'organizer'
  WHERE id = p_user_id;
  
  SELECT to_jsonb(public.clubs.*) INTO v_result FROM public.clubs WHERE id = v_club_id;
  RETURN v_result;
END;
$$;

-- 6. Stored Procedure for atomic event registration
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id UUID,
  p_user_id UUID,
  p_team_name VARCHAR,
  p_registration_data JSONB,
  p_participant_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current INTEGER;
  v_max INTEGER;
  v_deadline TIMESTAMP WITH TIME ZONE;
  v_registration JSONB;
BEGIN
  -- Check capacity and deadline under lock
  SELECT current_participants, max_participants, registration_deadline 
  INTO v_current, v_max, v_deadline
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  IF NOW() > v_deadline THEN
    RAISE EXCEPTION 'Registration deadline has passed';
  END IF;
  
  IF v_max IS NOT NULL AND v_current + p_participant_count > v_max THEN
    RAISE EXCEPTION 'Event is full';
  END IF;
  
  -- Insert registration
  INSERT INTO public.event_registrations (
    user_id,
    event_id,
    team_name,
    status,
    registration_data
  )
  VALUES (
    p_user_id,
    p_event_id,
    p_team_name,
    'registered',
    p_registration_data
  )
  RETURNING to_jsonb(public.event_registrations.*) INTO v_registration;
  
  -- Update event participant count
  UPDATE public.events
  SET current_participants = current_participants + p_participant_count,
      updated_at = NOW()
  WHERE id = p_event_id;
  
  RETURN v_registration;
END;
$$;

-- 7. User Sync trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, college, branch, gender, avatar_url, bio)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'college', 'Not specified'),
    new.raw_user_meta_data->>'branch',
    new.raw_user_meta_data->>'gender',
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      college = EXCLUDED.college,
      branch = EXCLUDED.branch,
      gender = EXCLUDED.gender;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
