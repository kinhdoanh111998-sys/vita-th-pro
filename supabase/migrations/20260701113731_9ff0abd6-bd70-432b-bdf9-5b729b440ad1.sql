
REVOKE EXECUTE ON FUNCTION public.generate_treatments_for_order() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Auth can read services" ON public.services;

CREATE POLICY "Staff read services"
  ON public.services FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'staff'::public.app_role)
  );

CREATE OR REPLACE VIEW public.services_public
WITH (security_invoker = true) AS
SELECT
  id, type, name, description, price, sale_price,
  default_sessions, image_url, image_urls, sku,
  is_hidden, created_at
FROM public.services
WHERE is_hidden = false;

GRANT SELECT ON public.services_public TO anon, authenticated;

DROP POLICY IF EXISTS "Auth upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth update product images" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete product images" ON storage.objects;

CREATE POLICY "Staff upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role)
    )
  );

CREATE POLICY "Staff update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role)
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role)
    )
  );

CREATE POLICY "Staff delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'staff'::public.app_role)
    )
  );
