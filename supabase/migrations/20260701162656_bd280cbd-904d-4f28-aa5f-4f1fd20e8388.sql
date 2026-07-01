
-- 1) Public read access for services catalog (non-hidden only), via services_public view already exists.
-- Add explicit anon/authenticated SELECT policy on services for non-hidden rows.
DROP POLICY IF EXISTS "Public can view non-hidden services" ON public.services;
CREATE POLICY "Public can view non-hidden services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (is_hidden = false);

GRANT SELECT ON public.services TO anon;

-- 2) Harden has_role: switch to SECURITY INVOKER and restrict EXECUTE.
-- Ensure users can read their own roles so INVOKER-mode has_role() still works.
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
