
-- Fix 1: Commissions insert - require staff_id = auth.uid() for staff, admins can insert any
DROP POLICY IF EXISTS "Staff insert commissions" ON public.commissions;
CREATE POLICY "Staff insert commissions" ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR (has_role(auth.uid(), 'staff'::app_role) AND staff_id = auth.uid())
  );

-- Fix 2: Customers - remove email-based ownership; tie to auth.uid() via id
DROP POLICY IF EXISTS "Users read own customer" ON public.customers;
CREATE POLICY "Users read own customer" ON public.customers
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users update own customer" ON public.customers;
CREATE POLICY "Users update own customer" ON public.customers
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users insert own customer" ON public.customers;
CREATE POLICY "Users insert own customer" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Fix related policies that keyed off customers.email = jwt email; switch to id = auth.uid()
DROP POLICY IF EXISTS "Customers read own treatments" ON public.treatments;
CREATE POLICY "Customers read own treatments" ON public.treatments
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers read own orders" ON public.orders;
CREATE POLICY "Customers read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "vcu customer read own" ON public.voucher_customers;
CREATE POLICY "vcu customer read own" ON public.voucher_customers
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "oi customer read own" ON public.order_items;
CREATE POLICY "oi customer read own" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid()));
