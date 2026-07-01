
-- 1. Roles enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed admin role for existing admin account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'zinzon010198@gmail.com'
ON CONFLICT DO NOTHING;

-- 2. customers: staff/admin only
DROP POLICY IF EXISTS "Auth can read customers" ON public.customers;
DROP POLICY IF EXISTS "Auth can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Auth can update customers" ON public.customers;
DROP POLICY IF EXISTS "Auth can delete customers" ON public.customers;

CREATE POLICY "Staff read customers" ON public.customers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff insert customers" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff update customers" ON public.customers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Admin delete customers" ON public.customers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 3. orders
DROP POLICY IF EXISTS "Auth can read orders" ON public.orders;
DROP POLICY IF EXISTS "Auth can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Auth can update orders" ON public.orders;
DROP POLICY IF EXISTS "Auth can delete orders" ON public.orders;

CREATE POLICY "Staff read orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff insert orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 4. treatments
DROP POLICY IF EXISTS "Auth can read treatments" ON public.treatments;
DROP POLICY IF EXISTS "Auth can insert treatments" ON public.treatments;
DROP POLICY IF EXISTS "Auth can update treatments" ON public.treatments;
DROP POLICY IF EXISTS "Auth can delete treatments" ON public.treatments;

CREATE POLICY "Staff read treatments" ON public.treatments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff insert treatments" ON public.treatments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff update treatments" ON public.treatments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Admin delete treatments" ON public.treatments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 5. services: writes admin-only (reads unchanged)
DROP POLICY IF EXISTS "Auth can insert services" ON public.services;
DROP POLICY IF EXISTS "Auth can update services" ON public.services;
DROP POLICY IF EXISTS "Auth can delete services" ON public.services;

CREATE POLICY "Admin insert services" ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update services" ON public.services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete services" ON public.services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 6. users table admin management
DROP POLICY IF EXISTS "Admin manage users" ON public.users;
CREATE POLICY "Admin manage users" ON public.users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 7. Lock down SECURITY DEFINER trigger function from direct calls
REVOKE EXECUTE ON FUNCTION public.generate_treatments_for_order() FROM PUBLIC, anon, authenticated;
