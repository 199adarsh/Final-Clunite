-- Migration: 009_create_certificates_schema.sql
-- Create issued_certificates table with full metadata, verification code, and template configurations

CREATE TABLE IF NOT EXISTS public.issued_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_code VARCHAR(32) UNIQUE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  template_url TEXT,
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_issued_certificates_user_id ON public.issued_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_recipient_email ON public.issued_certificates(recipient_email);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_code ON public.issued_certificates(certificate_code);

-- Enable RLS
ALTER TABLE public.issued_certificates ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified certificates
CREATE POLICY "Public can view issued certificates"
  ON public.issued_certificates FOR SELECT
  USING (true);

-- Allow organizers and authenticated users to insert certificates
CREATE POLICY "Authenticated users can issue certificates"
  ON public.issued_certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);
