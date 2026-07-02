
-- ENUMS
DO $$ BEGIN CREATE TYPE public.voucher_discount_type AS ENUM ('percent','fixed_amount'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_item_type AS ENUM ('product','service'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- VOUCHERS
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type public.voucher_discount_type NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  valid_from timestamptz,
  valid_to timestamptz,
  cover_image text,
  headline text,
  sub_headline text,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.vouchers_uppercase_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.code := upper(btrim(NEW.code)); NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_vouchers_uppercase ON public.vouchers;
CREATE TRIGGER trg_vouchers_uppercase BEFORE INSERT OR UPDATE ON public.vouchers
FOR EACH ROW EXECUTE FUNCTION public.vouchers_uppercase_code();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO authenticated;
GRANT SELECT ON public.vouchers TO anon;
GRANT ALL ON public.vouchers TO service_role;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vouchers read all" ON public.vouchers;
CREATE POLICY "vouchers read all" ON public.vouchers FOR SELECT USING (true);
DROP POLICY IF EXISTS "vouchers admin write" ON public.vouchers;
CREATE POLICY "vouchers admin write" ON public.vouchers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- VOUCHER_CONDITIONS
CREATE TABLE IF NOT EXISTS public.voucher_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  item_type public.order_item_type NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voucher_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_vc_voucher ON public.voucher_conditions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vc_item ON public.voucher_conditions(item_type, item_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voucher_conditions TO authenticated;
GRANT SELECT ON public.voucher_conditions TO anon;
GRANT ALL ON public.voucher_conditions TO service_role;
ALTER TABLE public.voucher_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vc read all" ON public.voucher_conditions;
CREATE POLICY "vc read all" ON public.voucher_conditions FOR SELECT USING (true);
DROP POLICY IF EXISTS "vc admin write" ON public.voucher_conditions;
CREATE POLICY "vc admin write" ON public.voucher_conditions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- VOUCHER_CUSTOMERS
CREATE TABLE IF NOT EXISTS public.voucher_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voucher_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_vcu_voucher ON public.voucher_customers(voucher_id);
CREATE INDEX IF NOT EXISTS idx_vcu_customer ON public.voucher_customers(customer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voucher_customers TO authenticated;
GRANT ALL ON public.voucher_customers TO service_role;
ALTER TABLE public.voucher_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vcu admin all" ON public.voucher_customers;
CREATE POLICY "vcu admin all" ON public.voucher_customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
DROP POLICY IF EXISTS "vcu customer read own" ON public.voucher_customers;
CREATE POLICY "vcu customer read own" ON public.voucher_customers FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE email = (auth.jwt()->>'email')));

-- ORDERS · thêm cột mới (Phần 5)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS voucher_id uuid REFERENCES public.vouchers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_staff_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 5.0;
ALTER TABLE public.orders ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN quantity DROP NOT NULL;

-- ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type public.order_item_type NOT NULL,
  item_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_oi_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oi_item ON public.order_items(item_type, item_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oi admin all" ON public.order_items;
CREATE POLICY "oi admin all" ON public.order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
DROP POLICY IF EXISTS "oi customer read own" ON public.order_items;
CREATE POLICY "oi customer read own" ON public.order_items FOR SELECT TO authenticated
  USING (order_id IN (
    SELECT o.id FROM public.orders o JOIN public.customers c ON c.id = o.customer_id
    WHERE c.email = (auth.jwt()->>'email')));

-- ORDER_CODE auto
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE d text := to_char(COALESCE(NEW.created_at, now()) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'DDMMYY'); n int;
BEGIN
  IF NEW.order_code IS NOT NULL AND btrim(NEW.order_code) <> '' THEN RETURN NEW; END IF;
  SELECT COALESCE(MAX((split_part(order_code,'-',2))::int), 0) + 1 INTO n
    FROM public.orders WHERE order_code LIKE d || '-%';
  NEW.order_code := d || '-' || lpad(n::text, 3, '0');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_orders_code ON public.orders;
CREATE TRIGGER trg_orders_code BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_order_code();

-- TREATMENTS · thêm service_id
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id);
CREATE INDEX IF NOT EXISTS idx_treatments_service ON public.treatments(service_id);

-- TRIGGER MỚI (Phần 8): sinh liệu trình khi orders chuyển sang paid
-- Vô hiệu trigger cũ chạy trên orders INSERT để tránh double-fire
DROP TRIGGER IF EXISTS trg_orders_generate_treatments ON public.orders;

CREATE OR REPLACE FUNCTION public.generate_treatments_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  it record;
  svc_sessions int;
  total_sessions int;
  i int;
BEGIN
  IF NOT (COALESCE(OLD.status,'') <> 'paid' AND NEW.status = 'paid') THEN
    RETURN NEW;
  END IF;

  -- Duyệt qua từng dòng service trong order_items
  FOR it IN
    SELECT item_id, quantity FROM public.order_items
    WHERE order_id = NEW.id AND item_type = 'service'
  LOOP
    SELECT COALESCE(default_sessions,1) INTO svc_sessions
      FROM public.services WHERE id = it.item_id;
    total_sessions := it.quantity * GREATEST(svc_sessions, 1);
    FOR i IN 1..total_sessions LOOP
      INSERT INTO public.treatments (order_id, customer_id, service_id, session_number, status)
      VALUES (NEW.id, NEW.customer_id, it.item_id, i, 'pending');
    END LOOP;
  END LOOP;

  -- Fallback: đơn cũ dùng service_id trực tiếp (không có order_items)
  IF NEW.service_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.order_items WHERE order_id = NEW.id
  ) THEN
    SELECT COALESCE(default_sessions,1) INTO svc_sessions
      FROM public.services WHERE id = NEW.service_id;
    total_sessions := COALESCE(NEW.quantity,1) * GREATEST(svc_sessions, 1);
    FOR i IN 1..total_sessions LOOP
      INSERT INTO public.treatments (order_id, customer_id, service_id, session_number, status)
      VALUES (NEW.id, NEW.customer_id, NEW.service_id, i, 'pending');
    END LOOP;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_orders_paid_generate_treatments ON public.orders;
CREATE TRIGGER trg_orders_paid_generate_treatments
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_treatments_on_paid();

-- Đồng thời chạy khi INSERT thẳng với status='paid' (đơn tạo & paid ngay)
CREATE OR REPLACE FUNCTION public.generate_treatments_on_insert_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it record; svc_sessions int; total_sessions int; i int;
BEGIN
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  FOR it IN
    SELECT item_id, quantity FROM public.order_items
    WHERE order_id = NEW.id AND item_type = 'service'
  LOOP
    SELECT COALESCE(default_sessions,1) INTO svc_sessions FROM public.services WHERE id = it.item_id;
    total_sessions := it.quantity * GREATEST(svc_sessions, 1);
    FOR i IN 1..total_sessions LOOP
      INSERT INTO public.treatments (order_id, customer_id, service_id, session_number, status)
      VALUES (NEW.id, NEW.customer_id, it.item_id, i, 'pending');
    END LOOP;
  END LOOP;
  IF NEW.service_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.order_items WHERE order_id = NEW.id
  ) THEN
    SELECT COALESCE(default_sessions,1) INTO svc_sessions FROM public.services WHERE id = NEW.service_id;
    total_sessions := COALESCE(NEW.quantity,1) * GREATEST(svc_sessions,1);
    FOR i IN 1..total_sessions LOOP
      INSERT INTO public.treatments (order_id, customer_id, service_id, session_number, status)
      VALUES (NEW.id, NEW.customer_id, NEW.service_id, i, 'pending');
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_orders_insert_paid_generate_treatments ON public.orders;
CREATE TRIGGER trg_orders_insert_paid_generate_treatments
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_treatments_on_insert_paid();
