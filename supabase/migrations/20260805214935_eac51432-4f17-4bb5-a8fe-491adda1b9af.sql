DROP POLICY IF EXISTS "Coaches and admins view all athletes" ON public.athletes;

CREATE POLICY "Coaches view published athletes"
ON public.athletes FOR SELECT TO authenticated
USING (is_published = true AND public.has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Admins view all athletes"
ON public.athletes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));