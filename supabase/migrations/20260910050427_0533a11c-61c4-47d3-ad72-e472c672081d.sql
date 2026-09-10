CREATE TABLE public.user_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own blocks"
  ON public.user_blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_user_id)
  WITH CHECK (auth.uid() = blocker_user_id);

CREATE POLICY "Admins can view all blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('message', 'athlete_profile', 'user')),
  target_id text NOT NULL,
  athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
  resolution_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file reports"
  ON public.content_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own reports"
  ON public.content_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can view all reports"
  ON public.content_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.content_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_content_reports_updated
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_content_reports_status ON public.content_reports (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_message_blocks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  athlete_owner uuid;
  blocked boolean;
BEGIN
  SELECT a.user_id INTO athlete_owner FROM public.athletes a WHERE a.id = NEW.athlete_id;

  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks b
    WHERE (b.blocker_user_id = NEW.sender_user_id
           AND b.blocked_user_id IN (NEW.coach_user_id, athlete_owner))
       OR (b.blocked_user_id = NEW.sender_user_id
           AND b.blocker_user_id IN (NEW.coach_user_id, athlete_owner))
       OR (b.blocker_user_id = athlete_owner AND b.blocked_user_id = NEW.coach_user_id)
       OR (b.blocker_user_id = NEW.coach_user_id AND b.blocked_user_id = athlete_owner)
  ) INTO blocked;

  IF blocked THEN
    RAISE EXCEPTION 'This conversation is blocked. Unblock to send messages.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_message_blocks
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_message_blocks();