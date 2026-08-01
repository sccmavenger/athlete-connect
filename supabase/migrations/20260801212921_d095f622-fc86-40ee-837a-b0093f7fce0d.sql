-- Normalize college names for fuzzy matching
CREATE OR REPLACE FUNCTION public.normalize_college(_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    lower(coalesce(_name, '')),
    '(university of |the university of |university|college|state college|\s|[^a-z0-9])',
    '',
    'g'
  )
$$;

-- Cap the list at 10 colleges per athlete
CREATE OR REPLACE FUNCTION public.enforce_college_interest_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.athlete_college_interests WHERE athlete_id = NEW.athlete_id;
  IF cnt >= 10 THEN
    RAISE EXCEPTION 'You can track up to 10 colleges. Remove one before adding another.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_college_interest_limit ON public.athlete_college_interests;
CREATE TRIGGER trg_college_interest_limit
BEFORE INSERT ON public.athlete_college_interests
FOR EACH ROW EXECUTE FUNCTION public.enforce_college_interest_limit();

-- Notify coaches whose program an athlete listed
CREATE OR REPLACE FUNCTION public.notify_coaches_of_interest(_athlete_id uuid, _college_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_name text;
  athlete_pos text;
  athlete_grad int;
  published boolean;
  c record;
BEGIN
  SELECT a.full_name, a.position, a.grad_year, a.is_published
    INTO athlete_name, athlete_pos, athlete_grad, published
  FROM public.athletes a WHERE a.id = _athlete_id;

  IF NOT COALESCE(published, false) THEN
    RETURN;
  END IF;

  FOR c IN
    SELECT DISTINCT cr.user_id
    FROM public.coach_requests cr
    WHERE cr.status = 'approved'
      AND cr.college IS NOT NULL
      AND public.normalize_college(cr.college) = public.normalize_college(_college_name)
      AND public.normalize_college(cr.college) <> ''
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      c.user_id,
      'interest',
      'An athlete listed your program',
      COALESCE(athlete_name, 'An athlete')
        || COALESCE(' (' || athlete_pos || ')', '')
        || COALESCE(', class of ' || athlete_grad::text, '')
        || ' added ' || _college_name || ' to their target school list.',
      '/a/' || _athlete_id
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_college_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_coaches_of_interest(NEW.athlete_id, NEW.college_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_college_interest ON public.athlete_college_interests;
CREATE TRIGGER trg_notify_college_interest
AFTER INSERT ON public.athlete_college_interests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_college_interest();

-- When a profile goes live, notify coaches for the schools already on the list
CREATE OR REPLACE FUNCTION public.notify_coaches_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.is_published AND NOT COALESCE(OLD.is_published, false) THEN
    FOR r IN SELECT college_name FROM public.athlete_college_interests WHERE athlete_id = NEW.id LOOP
      PERFORM public.notify_coaches_of_interest(NEW.id, r.college_name);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_coaches_on_publish ON public.athletes;
CREATE TRIGGER trg_notify_coaches_on_publish
AFTER UPDATE ON public.athletes
FOR EACH ROW EXECUTE FUNCTION public.notify_coaches_on_publish();

-- Ensure previously-defined triggers exist (bookmarks, messages, consent, timestamps)
DROP TRIGGER IF EXISTS trg_notify_athlete_on_save ON public.coach_saved_athletes;
CREATE TRIGGER trg_notify_athlete_on_save
AFTER INSERT ON public.coach_saved_athletes
FOR EACH ROW EXECUTE FUNCTION public.notify_athlete_on_save();

DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

DROP TRIGGER IF EXISTS trg_enforce_guardian_consent ON public.athletes;
CREATE TRIGGER trg_enforce_guardian_consent
BEFORE INSERT OR UPDATE ON public.athletes
FOR EACH ROW EXECUTE FUNCTION public.enforce_guardian_consent();