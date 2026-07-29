ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

GRANT SELECT ON public.athletes TO anon;
GRANT SELECT ON public.athlete_videos TO anon;
GRANT SELECT ON public.athlete_events TO anon;
GRANT SELECT ON public.athlete_photos TO anon;

CREATE POLICY "Public can view published athletes"
  ON public.athletes FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Public can view published athlete videos"
  ON public.athlete_videos FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_videos.athlete_id AND a.is_published));

CREATE POLICY "Public can view published athlete events"
  ON public.athlete_events FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_events.athlete_id AND a.is_published));

CREATE POLICY "Public can view published athlete photos"
  ON public.athlete_photos FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.athletes a WHERE a.id = athlete_photos.athlete_id AND a.is_published));