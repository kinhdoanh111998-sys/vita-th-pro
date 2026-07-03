
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

CREATE POLICY "avatars_owner_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
