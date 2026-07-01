
-- =========== CUSTOMERS ===========
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update customers" ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- =========== SERVICES ===========
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(14,2) NOT NULL DEFAULT 0,
  default_sessions integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update services" ON public.services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete services" ON public.services FOR DELETE TO authenticated USING (true);

-- =========== ORDERS ===========
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete orders" ON public.orders FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_service ON public.orders(service_id);

-- =========== TREATMENTS ===========
CREATE TABLE IF NOT EXISTS public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  qr_code_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can read treatments" ON public.treatments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert treatments" ON public.treatments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update treatments" ON public.treatments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete treatments" ON public.treatments FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_treatments_order ON public.treatments(order_id);
CREATE INDEX IF NOT EXISTS idx_treatments_customer ON public.treatments(customer_id);

-- =========== TRIGGER: Auto-generate treatments on paid order ===========
CREATE OR REPLACE FUNCTION public.generate_treatments_for_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i integer;
BEGIN
  IF NEW.status = 'paid' AND NEW.quantity > 0 THEN
    FOR i IN 1..NEW.quantity LOOP
      INSERT INTO public.treatments (order_id, customer_id, session_number, status)
      VALUES (NEW.id, NEW.customer_id, i, 'pending');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_generate_treatments ON public.orders;
CREATE TRIGGER trg_orders_generate_treatments
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_treatments_for_order();
