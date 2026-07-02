-- Cho phép người dùng vừa đăng ký tự tạo hồ sơ khách hàng và profile users
CREATE POLICY "Users insert own customer" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "Users read own customer" ON public.customers
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "Users update own customer" ON public.customers
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR email = (auth.jwt() ->> 'email'::text))
  WITH CHECK (id = auth.uid() OR email = (auth.jwt() ->> 'email'::text));

CREATE POLICY "Users insert own profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());