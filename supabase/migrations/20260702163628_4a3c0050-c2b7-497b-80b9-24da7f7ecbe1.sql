
-- 1) customers: ref_code, referred_by, referred_at
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS ref_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referred_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS customers_ref_code_key ON public.customers(ref_code) WHERE ref_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON public.customers(referred_by) WHERE referred_by IS NOT NULL;

-- 2) generator + trigger for ref_code
CREATE OR REPLACE FUNCTION public.gen_ref_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- omit 0,1,I,O
  code TEXT;
  i INT;
  tries INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.customers WHERE ref_code = code);
    tries := tries + 1;
    IF tries > 20 THEN
      code := code || substr(md5(random()::text), 1, 2);
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END $$;

CREATE OR REPLACE FUNCTION public.customers_assign_ref_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ref_code IS NULL OR btrim(NEW.ref_code) = '' THEN
    NEW.ref_code := public.gen_ref_code();
  END IF;
  -- Prevent self-referral
  IF NEW.referred_by IS NOT NULL AND NEW.referred_by = NEW.id THEN
    NEW.referred_by := NULL;
  END IF;
  IF NEW.referred_by IS NOT NULL AND NEW.referred_at IS NULL THEN
    NEW.referred_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_customers_assign_ref_code ON public.customers;
CREATE TRIGGER trg_customers_assign_ref_code
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.customers_assign_ref_code();

-- Backfill existing customers
UPDATE public.customers SET ref_code = public.gen_ref_code() WHERE ref_code IS NULL;

-- 3) referral_clicks table
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL,
  landing_path TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  session_id TEXT,
  converted_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referral_clicks TO authenticated;
GRANT ALL ON public.referral_clicks TO service_role;

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/manager read referral_clicks" ON public.referral_clicks
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE INDEX IF NOT EXISTS idx_referral_clicks_ref_code ON public.referral_clicks(ref_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_created ON public.referral_clicks(created_at DESC);

-- 4) Affiliate commission trigger on orders paid
CREATE OR REPLACE FUNCTION public.affiliate_generate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer UUID;
  v_percent NUMERIC(5,2);
  v_amount NUMERIC(14,2);
BEGIN
  -- Only when status transitions to 'paid'
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN RETURN NEW; END IF;

  SELECT referred_by INTO v_referrer FROM public.customers WHERE id = NEW.customer_id;
  IF v_referrer IS NULL THEN RETURN NEW; END IF;
  IF v_referrer = NEW.customer_id THEN RETURN NEW; END IF;

  -- Skip if commission already exists for this order+referrer
  IF EXISTS (
    SELECT 1 FROM public.commissions
    WHERE reference_id = NEW.id
      AND staff_id = v_referrer
      AND commission_type = 'affiliate_order'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT commission_percent INTO v_percent
    FROM public.affiliate_configs
    WHERE active = true
    ORDER BY updated_at DESC
    LIMIT 1;
  IF v_percent IS NULL THEN v_percent := 5.0; END IF;

  v_amount := ROUND(COALESCE(NEW.total_amount, 0) * v_percent / 100.0, 0);
  IF v_amount <= 0 THEN RETURN NEW; END IF;

  -- Referrer must exist as a user row (FK to users.id)
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_referrer) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.commissions (staff_id, commission_type, reference_id, amount, status, note)
  VALUES (v_referrer, 'affiliate_order', NEW.id, v_amount, 'pending',
          'Hoa hồng affiliate ' || v_percent || '% từ đơn ' || COALESCE(NEW.order_code, NEW.id::text));

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_orders_affiliate_commission ON public.orders;
CREATE TRIGGER trg_orders_affiliate_commission
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.affiliate_generate_commission();

-- Ensure at least one active affiliate config exists
INSERT INTO public.affiliate_configs (ref_code, commission_percent, note, active)
SELECT 'DEFAULT', 5.0, 'Cấu hình mặc định affiliate', true
WHERE NOT EXISTS (SELECT 1 FROM public.affiliate_configs WHERE active = true);
