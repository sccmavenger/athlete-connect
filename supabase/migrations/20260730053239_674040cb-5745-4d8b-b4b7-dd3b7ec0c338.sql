ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_athlete_on_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_owner uuid;
  athlete_name text;
  coach_name text;
  guardian_user uuid;
BEGIN
  SELECT a.user_id, a.full_name INTO athlete_owner, athlete_name
  FROM public.athletes a WHERE a.id = NEW.athlete_id;

  IF athlete_owner IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.display_name, 'A college coach') INTO coach_name
  FROM public.profiles p WHERE p.id = NEW.coach_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    athlete_owner,
    'bookmark',
    'A coach bookmarked your profile',
    COALESCE(coach_name, 'A college coach') || ' added ' || COALESCE(athlete_name, 'your profile') || ' to their recruiting shortlist.',
    '/a/' || NEW.athlete_id
  );

  SELECT p.id INTO guardian_user
  FROM public.athlete_contacts c
  JOIN public.profiles p ON lower(p.email) = lower(c.guardian_email)
  WHERE c.athlete_id = NEW.athlete_id AND c.guardian_email IS NOT NULL AND p.id <> athlete_owner
  LIMIT 1;

  IF guardian_user IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      guardian_user,
      'bookmark',
      'A coach bookmarked ' || COALESCE(athlete_name, 'your athlete'),
      COALESCE(coach_name, 'A college coach') || ' added this athlete to their recruiting shortlist.',
      '/a/' || NEW.athlete_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_athlete_on_save ON public.coach_saved_athletes;
CREATE TRIGGER trg_notify_athlete_on_save
AFTER INSERT ON public.coach_saved_athletes
FOR EACH ROW EXECUTE FUNCTION public.notify_athlete_on_save();