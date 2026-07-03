
-- Module 3: Payment method / status / source cho orders + voucher tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS voucher_code text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS note text;

-- Constraint values
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod','transfer'));
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending','paid','failed','refunded'));
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_source_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_source_check
  CHECK (order_source IN ('web','app','admin'));

-- Khi payment_status -> 'paid' thì cũng set status='paid' để trigger cũ sinh treatments
CREATE OR REPLACE FUNCTION public.orders_sync_payment_status_to_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status,'') <> 'paid' THEN
    IF NEW.status IS DISTINCT FROM 'paid' THEN
      NEW.status := 'paid';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_orders_sync_paid ON public.orders;
CREATE TRIGGER trg_orders_sync_paid
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_sync_payment_status_to_status();

-- system_settings: thêm cột show_store_list + vietqr_* config
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS show_store_list boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS zalo_oa_url text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_account_holder text,
  ADD COLUMN IF NOT EXISTS bank_bin text;

-- Đảm bảo các đơn cũ mặc định 'pending'/'cod'/'web' đúng chuẩn (đã default). Không update dữ liệu.
