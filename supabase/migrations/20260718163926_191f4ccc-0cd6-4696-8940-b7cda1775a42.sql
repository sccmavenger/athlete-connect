
CREATE POLICY "Athletes upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'athlete-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Athletes update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'athlete-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Athletes delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'athlete-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owner reads own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'athlete-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Coaches and admins read athlete media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'athlete-media'
  AND (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
);
