CREATE TABLE public.athlete_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL UNIQUE REFERENCES public.athletes(id) ON DELETE CASCADE,
  athlete_email text,
  athlete_phone text,
  guardian_name text,
  guardian_email text,
  guardian_phone text,
  club_coach_name text,
  club_coach_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_contacts TO authenticated;
GRANT ALL ON public.athlete_contacts TO service_role;

ALTER TABLE public.athlete_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own contact info"
ON public.athlete_contacts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_contacts.athlete_id AND a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_contacts.athlete_id AND a.user_id = auth.uid()));

CREATE POLICY "Approved coaches and admins view contact info"
ON public.athlete_contacts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_athlete_contacts_updated_at
BEFORE UPDATE ON public.athlete_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();