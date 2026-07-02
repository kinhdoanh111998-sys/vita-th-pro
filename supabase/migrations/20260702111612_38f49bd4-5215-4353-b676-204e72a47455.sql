
-- 1) Restrict role_definitions SELECT to staff/admin/manager
DROP POLICY IF EXISTS "Ops read role_definitions" ON public.role_definitions;
CREATE POLICY "Staff read role_definitions" ON public.role_definitions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR has_role(auth.uid(), 'staff'::app_role));

-- 2) Prevent self-assigning privileged role on users insert
DROP POLICY IF EXISTS "Users insert own profile" ON public.users;
CREATE POLICY "Users insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND (role IS NULL OR role = 'customer')
  );

-- 3) Remove overly-broad public SELECT on product-images bucket.
-- App uses signed URLs (createSignedUrl) which bypass RLS via signed tokens,
-- so anonymous read policy is not required.
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;

-- 4) Lock down SECURITY DEFINER RPCs so only intended roles can call them.
-- Attendance RPCs must be callable by signed-in staff (they auth-check inside).
REVOKE EXECUTE ON FUNCTION public.fn_check_in(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_check_out(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_check_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_check_out(uuid, text) TO authenticated;

-- Trigger-only functions must not be callable directly by clients.
REVOKE EXECUTE ON FUNCTION public.generate_treatments_for_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_insert_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_paid() FROM PUBLIC, anon, authenticated;
