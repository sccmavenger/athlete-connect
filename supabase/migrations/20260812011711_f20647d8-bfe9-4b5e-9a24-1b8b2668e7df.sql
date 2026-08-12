
-- 1) Storage: coaches only see media belonging to published athletes
DROP POLICY IF EXISTS "Coaches and admins read athlete media" ON storage.objects;

CREATE POLICY "Admins read athlete media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'athlete-media'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Coaches read published athlete media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'athlete-media'
  AND public.has_role(auth.uid(), 'coach')
  AND EXISTS (
    SELECT 1 FROM public.athletes a
    WHERE a.is_published = true
      AND (
        a.user_id::text = (storage.foldername(name))[1]
        OR EXISTS (
          SELECT 1 FROM public.athlete_guardians g
          WHERE g.athlete_id = a.id
            AND g.user_id::text = (storage.foldername(name))[1]
        )
      )
  )
);

-- 2) Profiles: coaches only see profiles related to athletes in their pipeline / conversations
DROP POLICY IF EXISTS "Coaches and admins view profiles" ON public.profiles;

CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches view related profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND (
    EXISTS (
      SELECT 1
      FROM public.coach_saved_athletes s
      JOIN public.athletes a ON a.id = s.athlete_id
      WHERE s.coach_user_id = auth.uid()
        AND a.is_published = true
        AND (
          a.user_id = profiles.id
          OR EXISTS (
            SELECT 1 FROM public.athlete_guardians g
            WHERE g.athlete_id = a.id AND g.user_id = profiles.id
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      JOIN public.athletes a2 ON a2.id = m.athlete_id
      WHERE m.coach_user_id = auth.uid()
        AND (
          a2.user_id = profiles.id
          OR m.sender_user_id = profiles.id
          OR EXISTS (
            SELECT 1 FROM public.athlete_guardians g2
            WHERE g2.athlete_id = a2.id AND g2.user_id = profiles.id
          )
        )
    )
  )
);
