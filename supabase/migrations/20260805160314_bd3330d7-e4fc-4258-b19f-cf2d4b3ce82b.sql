-- 1. Athlete rows: public/anon read only, with sensitive columns removed from the anon grant.
DROP POLICY IF EXISTS "Public can view published athletes" ON public.athletes;
CREATE POLICY "Anon can view published athletes"
ON public.athletes FOR SELECT TO anon
USING (is_published = true);

REVOKE SELECT ON public.athletes FROM anon;
GRANT SELECT (
  id, full_name, hometown, state, high_school, grad_year, position,
  height_inches, weight_lbs, jersey_number, gpa, intended_major,
  instagram_handle, tiktok_handle, profile_photo_url, bio,
  created_at, updated_at, is_published, zip_code, latitude, longitude, sport_gender
) ON public.athletes TO anon;

-- 2. Athlete contacts: admins, or approved coaches with an established relationship.
DROP POLICY IF EXISTS "Approved coaches and admins view contact info" ON public.athlete_contacts;
CREATE POLICY "Related approved coaches and admins view contact info"
ON public.athlete_contacts FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'coach')
    AND EXISTS (
      SELECT 1 FROM public.coach_requests cr
      WHERE cr.user_id = auth.uid() AND cr.status = 'approved'
    )
    AND EXISTS (
      SELECT 1 FROM public.coach_saved_athletes s
      WHERE s.coach_user_id = auth.uid()
        AND s.athlete_id = athlete_contacts.athlete_id
    )
    AND EXISTS (
      SELECT 1 FROM public.athletes a
      WHERE a.id = athlete_contacts.athlete_id AND a.is_published
    )
  )
);

-- 3. Coach-facing media/schedule/interest reads limited to published profiles.
DROP POLICY IF EXISTS "Coaches and admins view videos" ON public.athlete_videos;
CREATE POLICY "Coaches view published videos" ON public.athlete_videos FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'coach') AND EXISTS (
    SELECT 1 FROM public.athletes a WHERE a.id = athlete_videos.athlete_id AND a.is_published))
);

DROP POLICY IF EXISTS "Coaches and admins view photos" ON public.athlete_photos;
CREATE POLICY "Coaches view published photos" ON public.athlete_photos FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'coach') AND EXISTS (
    SELECT 1 FROM public.athletes a WHERE a.id = athlete_photos.athlete_id AND a.is_published))
);

DROP POLICY IF EXISTS "Coaches and admins view events" ON public.athlete_events;
CREATE POLICY "Coaches view published events" ON public.athlete_events FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'coach') AND EXISTS (
    SELECT 1 FROM public.athletes a WHERE a.id = athlete_events.athlete_id AND a.is_published))
);

DROP POLICY IF EXISTS "Coaches and admins view college interests" ON public.athlete_college_interests;
CREATE POLICY "Coaches view published college interests" ON public.athlete_college_interests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'coach') AND EXISTS (
    SELECT 1 FROM public.athletes a WHERE a.id = athlete_college_interests.athlete_id AND a.is_published))
);