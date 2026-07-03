CREATE POLICY "Users read own customer by email"
ON public.customers
FOR SELECT
TO authenticated
USING (
  email IS NOT NULL
  AND lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
);