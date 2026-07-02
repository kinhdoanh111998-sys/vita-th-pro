
-- store-images: public read, admin/manager write
CREATE POLICY "store_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-images');

CREATE POLICY "store_images_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY "store_images_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY "store_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

-- avatars: public read, users manage their own folder (user_id/*)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
