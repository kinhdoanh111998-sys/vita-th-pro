
DROP POLICY IF EXISTS "Admin manager read users" ON public.users;
CREATE POLICY "Admin manager read users"
  ON public.users FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Manager read commissions" ON public.commissions;
CREATE POLICY "Manager read commissions"
  ON public.commissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));
