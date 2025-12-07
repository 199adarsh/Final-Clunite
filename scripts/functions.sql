-- Function to create registration and update participant count in a transaction
CREATE OR REPLACE FUNCTION create_registration(
  registration_data JSONB,
  event_id_param UUID,
  participant_count INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_registration JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Insert registration
    INSERT INTO event_registrations (
      event_id,
      team_name,
      status,
      registration_data
    )
    VALUES (
      event_id_param,
      registration_data->>'team_name',
      registration_data->>'status',
      registration_data->'registration_data'
    )
    RETURNING to_jsonb(event_registrations.*) INTO new_registration;

    -- Update participant count
    UPDATE events
    SET 
      current_participants = current_participants + participant_count,
      updated_at = NOW()
    WHERE id = event_id_param;

    -- Commit transaction
    RETURN new_registration;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    RAISE EXCEPTION 'Failed to create registration: %', SQLERRM;
  END;
END;
$$;