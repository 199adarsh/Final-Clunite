-- Migration: Sync event participants trigger
-- This trigger automatically updates the current_participants column in the events table
-- when registrations are created, updated (e.g. status changes to/from cancelled), or deleted.

CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_count INTEGER;
BEGIN
  -- Get the event_id from OLD or NEW row
  IF TG_OP = 'DELETE' THEN
    v_event_id := OLD.event_id;
  ELSE
    v_event_id := NEW.event_id;
  END IF;

  -- Calculate total active participants (status != 'cancelled')
  SELECT COALESCE(SUM(
    CASE 
      WHEN status = 'cancelled' THEN 0
      WHEN registration_data ? 'team_members' AND jsonb_typeof(registration_data -> 'team_members') = 'array' 
        THEN jsonb_array_length(registration_data -> 'team_members')
      ELSE 1
    END
  ), 0)
  INTO v_count
  FROM public.event_registrations
  WHERE event_id = v_event_id;

  -- Update the event's current_participants count
  UPDATE public.events
  SET current_participants = v_count,
      updated_at = NOW()
  WHERE id = v_event_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS trg_update_event_participant_count ON public.event_registrations;

-- Create the trigger
CREATE TRIGGER trg_update_event_participant_count
AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_participant_count();

-- Run a one-time update to sync current_participants for all existing events
UPDATE public.events e
SET current_participants = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN r.status = 'cancelled' THEN 0
      WHEN r.registration_data ? 'team_members' AND jsonb_typeof(r.registration_data -> 'team_members') = 'array' 
        THEN jsonb_array_length(r.registration_data -> 'team_members')
      ELSE 1
    END
  ), 0)
  FROM public.event_registrations r
  WHERE r.event_id = e.id
);
