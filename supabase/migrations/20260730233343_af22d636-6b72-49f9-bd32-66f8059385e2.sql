-- ============ 7. Parent/guardian role ============
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- ============ Athlete compliance fields ============
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS ncaa_id text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS guardian_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS guardian_consent_email text,
  ADD COLUMN IF NOT EXISTS guardian_consent_name text;

-- ============ Guardian link ============
CREATE TABLE IF NOT EXISTS public.athlete_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, user_id)
);
GRANT SELECT, DELETE ON public.athlete_guardians TO authenticated;
GRANT ALL ON public.athlete_guardians TO service_role;
ALTER TABLE public.athlete_guardians ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.athlete_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  invited_email text,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  redeemed_by uuid,
  redeemed_at timestamptz
);
GRANT SELECT, INSERT, DELETE ON public.athlete_invites TO authenticated;
GRANT ALL ON public.athlete_invites TO service_role;
ALTER TABLE public.athlete_invites ENABLE ROW LEVEL SECURITY;

-- Manager = athlete owner OR linked guardian
CREATE OR REPLACE FUNCTION public.is_athlete_manager(_athlete_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.athletes a WHERE a.id = _athlete_id AND a.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.athlete_guardians g WHERE g.athlete_id = _athlete_id AND g.user_id = _user_id
  )
$$;

CREATE POLICY "Managers view guardian links" ON public.athlete_guardians
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Athlete owner removes guardian links" ON public.athlete_guardians
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid())
         OR user_id = auth.uid());

CREATE POLICY "Managers manage invites" ON public.athlete_invites
  FOR SELECT TO authenticated USING (public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Managers create invites" ON public.athlete_invites
  FOR INSERT TO authenticated WITH CHECK (public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Managers delete invites" ON public.athlete_invites
  FOR DELETE TO authenticated USING (public.is_athlete_manager(athlete_id, auth.uid()));

-- Guardian access to athlete data
CREATE POLICY "Guardians manage athlete profile" ON public.athletes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athlete_guardians g WHERE g.athlete_id = athletes.id AND g.user_id = auth.uid()));
CREATE POLICY "Guardians update athlete profile" ON public.athletes
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athlete_guardians g WHERE g.athlete_id = athletes.id AND g.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athlete_guardians g WHERE g.athlete_id = athletes.id AND g.user_id = auth.uid()));

CREATE POLICY "Guardians manage contacts" ON public.athlete_contacts
  FOR ALL TO authenticated
  USING (public.is_athlete_manager(athlete_id, auth.uid()))
  WITH CHECK (public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Guardians manage videos" ON public.athlete_videos
  FOR ALL TO authenticated
  USING (public.is_athlete_manager(athlete_id, auth.uid()))
  WITH CHECK (public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Guardians manage photos" ON public.athlete_photos
  FOR ALL TO authenticated
  USING (public.is_athlete_manager(athlete_id, auth.uid()))
  WITH CHECK (public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Guardians manage events" ON public.athlete_events
  FOR ALL TO authenticated
  USING (public.is_athlete_manager(athlete_id, auth.uid()))
  WITH CHECK (public.is_athlete_manager(athlete_id, auth.uid()));

-- ============ 1. Colleges of interest ============
CREATE TABLE IF NOT EXISTS public.athlete_college_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  college_name text NOT NULL,
  division text,
  state text,
  status text NOT NULL DEFAULT 'interested',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_college_interests TO authenticated;
GRANT ALL ON public.athlete_college_interests TO service_role;
ALTER TABLE public.athlete_college_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage college interests" ON public.athlete_college_interests
  FOR ALL TO authenticated
  USING (public.is_athlete_manager(athlete_id, auth.uid()))
  WITH CHECK (public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Coaches and admins view college interests" ON public.athlete_college_interests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_college_interests_updated
  BEFORE UPDATE ON public.athlete_college_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 1b. Messaging ============
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_user_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(athlete_id, coach_user_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON public.messages
  FOR SELECT TO authenticated
  USING (coach_user_id = auth.uid() OR public.is_athlete_manager(athlete_id, auth.uid()));
CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      (coach_user_id = auth.uid() AND public.has_role(auth.uid(), 'coach'))
      OR public.is_athlete_manager(athlete_id, auth.uid())
    )
  );
CREATE POLICY "Participants mark messages read" ON public.messages
  FOR UPDATE TO authenticated
  USING (coach_user_id = auth.uid() OR public.is_athlete_manager(athlete_id, auth.uid()))
  WITH CHECK (coach_user_id = auth.uid() OR public.is_athlete_manager(athlete_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_owner uuid;
  athlete_name text;
  sender_name text;
  g record;
BEGIN
  SELECT a.user_id, a.full_name INTO athlete_owner, athlete_name FROM public.athletes a WHERE a.id = NEW.athlete_id;
  SELECT COALESCE(p.display_name, 'Someone') INTO sender_name FROM public.profiles p WHERE p.id = NEW.sender_user_id;

  IF NEW.sender_user_id = NEW.coach_user_id THEN
    -- coach -> athlete side
    IF athlete_owner IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (athlete_owner, 'message', 'New message from a college coach',
              COALESCE(sender_name, 'A coach') || ': ' || left(NEW.body, 120), '/messages');
    END IF;
    FOR g IN SELECT user_id FROM public.athlete_guardians WHERE athlete_id = NEW.athlete_id LOOP
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (g.user_id, 'message', 'New message from a college coach',
              COALESCE(sender_name, 'A coach') || ': ' || left(NEW.body, 120), '/messages');
    END LOOP;
  ELSE
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.coach_user_id, 'message', 'New message from an athlete',
            COALESCE(athlete_name, 'An athlete') || ': ' || left(NEW.body, 120), '/coaches/messages');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- ============ 2. Profile analytics ============
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  viewer_user_id uuid,
  viewer_role text NOT NULL DEFAULT 'public',
  viewer_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_athlete ON public.profile_views(athlete_id, created_at DESC);
GRANT SELECT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers view own analytics" ON public.profile_views
  FOR SELECT TO authenticated
  USING (public.is_athlete_manager(athlete_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- ============ 5. Coach pipeline ============
ALTER TABLE public.coach_saved_athletes
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'watching',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS trg_saved_athletes_updated ON public.coach_saved_athletes;
CREATE TRIGGER trg_saved_athletes_updated BEFORE UPDATE ON public.coach_saved_athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.coach_saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  alerts_enabled boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_saved_searches TO authenticated;
GRANT ALL ON public.coach_saved_searches TO service_role;
ALTER TABLE public.coach_saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own saved searches" ON public.coach_saved_searches
  FOR ALL TO authenticated
  USING (coach_user_id = auth.uid() AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (coach_user_id = auth.uid() AND public.has_role(auth.uid(), 'coach'));
CREATE TRIGGER trg_saved_searches_updated BEFORE UPDATE ON public.coach_saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 8. Under-13 publish gate ============
CREATE OR REPLACE FUNCTION public.enforce_guardian_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_published
     AND NEW.date_of_birth IS NOT NULL
     AND NEW.date_of_birth > (current_date - interval '13 years')
     AND NEW.guardian_consent_at IS NULL THEN
    RAISE EXCEPTION 'Athletes under 13 need verified guardian consent before the profile can be published';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guardian_consent ON public.athletes;
CREATE TRIGGER trg_guardian_consent BEFORE INSERT OR UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_guardian_consent();
