
-- ============================================
-- MODULE 1: stores
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  main_image text,
  address text,
  phone text,
  hotline text,
  email text,
  open_hours text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores_public_read_active"
  ON public.stores FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "stores_admin_insert"
  ON public.stores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "stores_admin_update"
  ON public.stores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "stores_admin_delete"
  ON public.stores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER stores_touch_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed 3 cơ sở từ mockdata homepage
INSERT INTO public.stores (name, address, hotline, phone, open_hours, is_active, sort_order)
VALUES
  ('VITA Premium Hà Nội', 'Tầng 3, 456 Thái Hà, Đống Đa, Hà Nội', '1900 6868', '1900 6868', '08:00 - 21:00', true, 1),
  ('VITA Signature Đà Nẵng', '789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', '0236 7788 999', '0236 7788 999', '08:00 - 21:00', true, 2),
  ('VITA Flagship TP.HCM', '123 Nguyễn Huệ, Bến Nghé, Quận 1, TP.HCM', '028 3822 5566', '028 3822 5566', '08:00 - 21:00', true, 3);

-- ============================================
-- MODULE 4: navigation_items
-- ============================================
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('homepage','app')),
  menu_key text NOT NULL,
  label text NOT NULL,
  route text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, menu_key)
);

GRANT SELECT ON public.navigation_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.navigation_items TO authenticated;
GRANT ALL ON public.navigation_items TO service_role;

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "navigation_public_read"
  ON public.navigation_items FOR SELECT
  USING (true);

CREATE POLICY "navigation_admin_write"
  ON public.navigation_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER navigation_touch_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed homepage nav
INSERT INTO public.navigation_items (platform, menu_key, label, route, sort_order) VALUES
  ('homepage', 'home',      'Trang chủ',  '/',          1),
  ('homepage', 'about',     'Giới thiệu', '/about',     2),
  ('homepage', 'products',  'Sản phẩm',   '/products',  3),
  ('homepage', 'services',  'Dịch vụ',    '/services',  4),
  ('homepage', 'events',    'Sự kiện',    '/events',    5),
  ('homepage', 'community', 'Cộng đồng',  '/community', 6),
  ('homepage', 'news',      'Tin tức',    '/news',      7),
  ('homepage', 'contact',   'Liên hệ',    '/contact',   8);

-- Seed app quick access (KHÔNG bao gồm bottom nav)
INSERT INTO public.navigation_items (platform, menu_key, label, route, sort_order) VALUES
  ('app', 'skin_ai',  'Soi da AI', '/app/skin-ai',  1),
  ('app', 'store',    'Cửa hàng',  '/app/store',    2),
  ('app', 'booking',  'Đặt lịch',  '/booking',      3),
  ('app', 'scan',     'Quét QR',   '/app/scan',     4),
  ('app', 'wallet',   'Ví VITA',   '/wallet',       5),
  ('app', 'vouchers', 'Ưu đãi',    '/app/vouchers', 6);
