-- Event expenses table to track detailed spend per event
CREATE TABLE IF NOT EXISTS public.event_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  vendor TEXT,
  payment_method TEXT,
  incurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_expenses_event_id ON public.event_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_expenses_category ON public.event_expenses(category);
CREATE INDEX IF NOT EXISTS idx_event_expenses_incurred_at ON public.event_expenses(incurred_at);

ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;

-- Allow admins of the event's club to manage expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_expenses' AND policyname='Admins can read expenses'
  ) THEN
    CREATE POLICY "Admins can read expenses" ON public.event_expenses
      FOR SELECT TO authenticated
      USING (
        event_id IN (
          SELECT e.id FROM public.events e
          JOIN public.club_memberships m ON m.club_id = e.club_id
          WHERE m.user_id = auth.uid() AND m.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_expenses' AND policyname='Admins can insert expenses'
  ) THEN
    CREATE POLICY "Admins can insert expenses" ON public.event_expenses
      FOR INSERT TO authenticated
      WITH CHECK (
        event_id IN (
          SELECT e.id FROM public.events e
          JOIN public.club_memberships m ON m.club_id = e.club_id
          WHERE m.user_id = auth.uid() AND m.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_expenses' AND policyname='Admins can update expenses'
  ) THEN
    CREATE POLICY "Admins can update expenses" ON public.event_expenses
      FOR UPDATE TO authenticated
      USING (
        event_id IN (
          SELECT e.id FROM public.events e
          JOIN public.club_memberships m ON m.club_id = e.club_id
          WHERE m.user_id = auth.uid() AND m.role = 'admin'
        )
      )
      WITH CHECK (
        event_id IN (
          SELECT e.id FROM public.events e
          JOIN public.club_memberships m ON m.club_id = e.club_id
          WHERE m.user_id = auth.uid() AND m.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_expenses' AND policyname='Admins can delete expenses'
  ) THEN
    CREATE POLICY "Admins can delete expenses" ON public.event_expenses
      FOR DELETE TO authenticated
      USING (
        event_id IN (
          SELECT e.id FROM public.events e
          JOIN public.club_memberships m ON m.club_id = e.club_id
          WHERE m.user_id = auth.uid() AND m.role = 'admin'
        )
      );
  END IF;
END $$;


