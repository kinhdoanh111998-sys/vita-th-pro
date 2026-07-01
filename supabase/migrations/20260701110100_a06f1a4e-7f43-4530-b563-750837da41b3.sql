
DROP POLICY IF EXISTS "Authenticated can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated can update system settings" ON public.system_settings;

CREATE POLICY "Admin insert system settings" ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update system settings" ON public.system_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
