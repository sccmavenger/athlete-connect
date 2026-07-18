
-- Roles enum + user_roles table (roles NEVER on profiles)
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'athlete');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Coaches and admins view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Athletes
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  hometown TEXT,
  state TEXT,
  high_school TEXT,
  grad_year INT,
  position TEXT,
  height_inches INT,
  weight_lbs INT,
  jersey_number TEXT,
  gpa NUMERIC(3,2),
  sat_score INT,
  act_score INT,
  intended_major TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  profile_photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athletes TO authenticated;
GRANT ALL ON public.athletes TO service_role;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete owner can view own" ON public.athletes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coaches and admins view all athletes" ON public.athletes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Athlete owner can insert own" ON public.athletes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Athlete owner can update own" ON public.athletes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Athlete owner can delete own" ON public.athletes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX athletes_grad_year_idx ON public.athletes(grad_year);
CREATE INDEX athletes_state_idx ON public.athletes(state);
CREATE INDEX athletes_position_idx ON public.athletes(position);

-- Athlete videos
CREATE TABLE public.athlete_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_videos TO authenticated;
GRANT ALL ON public.athlete_videos TO service_role;
ALTER TABLE public.athlete_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage own videos" ON public.athlete_videos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid()));
CREATE POLICY "Coaches and admins view videos" ON public.athlete_videos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- Athlete photos
CREATE TABLE public.athlete_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_photos TO authenticated;
GRANT ALL ON public.athlete_photos TO service_role;
ALTER TABLE public.athlete_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage own photos" ON public.athlete_photos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid()));
CREATE POLICY "Coaches and admins view photos" ON public.athlete_photos
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- Athlete events (games / camps)
CREATE TABLE public.athlete_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TEXT,
  opponent TEXT,
  location TEXT,
  is_mayb BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_events TO authenticated;
GRANT ALL ON public.athlete_events TO service_role;
ALTER TABLE public.athlete_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manage own events" ON public.athlete_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_id AND a.user_id = auth.uid()));
CREATE POLICY "Coaches and admins view events" ON public.athlete_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

-- Coach requests
CREATE TYPE public.coach_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.coach_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT,
  title TEXT,
  message TEXT,
  status public.coach_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.coach_requests TO authenticated;
GRANT ALL ON public.coach_requests TO service_role;
ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester views own request" ON public.coach_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Requester inserts own request" ON public.coach_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all requests" ON public.coach_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update requests" ON public.coach_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coach saved athletes
CREATE TABLE public.coach_saved_athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_user_id, athlete_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_saved_athletes TO authenticated;
GRANT ALL ON public.coach_saved_athletes TO service_role;
ALTER TABLE public.coach_saved_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach manages own saved list" ON public.coach_saved_athletes
  FOR ALL TO authenticated
  USING (auth.uid() = coach_user_id AND public.has_role(auth.uid(), 'coach'))
  WITH CHECK (auth.uid() = coach_user_id AND public.has_role(auth.uid(), 'coach'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New user handler: create profile row, assign athlete role by default,
-- or create a coach_request if role_intent = coach.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_intent TEXT;
  display_name_val TEXT;
BEGIN
  role_intent := COALESCE(NEW.raw_user_meta_data->>'role_intent', 'athlete');
  display_name_val := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, display_name_val, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  IF role_intent = 'coach' THEN
    INSERT INTO public.coach_requests (user_id, full_name, email, college, title, message)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', display_name_val),
      NEW.email,
      NEW.raw_user_meta_data->>'college',
      NEW.raw_user_meta_data->>'title',
      NEW.raw_user_meta_data->>'message'
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'athlete')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
