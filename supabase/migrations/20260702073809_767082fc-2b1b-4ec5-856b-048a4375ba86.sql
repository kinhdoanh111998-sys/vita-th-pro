
-- Phase 1: Cho phép Manager đọc/sửa dữ liệu vận hành như Admin/Staff
-- (giữ nguyên: chỉ Admin được UPDATE commissions & services).

-- customers
DROP POLICY IF EXISTS "Staff read customers" ON public.customers;
CREATE POLICY "Ops read customers" ON public.customers FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
DROP POLICY IF EXISTS "Staff update customers" ON public.customers;
CREATE POLICY "Ops update customers" ON public.customers FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- orders
DROP POLICY IF EXISTS "Staff read orders" ON public.orders;
CREATE POLICY "Ops read orders" ON public.orders FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
CREATE POLICY "Ops update orders" ON public.orders FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- treatments
DROP POLICY IF EXISTS "Staff read treatments" ON public.treatments;
CREATE POLICY "Ops read treatments" ON public.treatments FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
DROP POLICY IF EXISTS "Staff update treatments" ON public.treatments;
CREATE POLICY "Ops update treatments" ON public.treatments FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- tours
DROP POLICY IF EXISTS "Staff read tours" ON public.tours;
CREATE POLICY "Ops read tours" ON public.tours FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
DROP POLICY IF EXISTS "Staff update tours" ON public.tours;
CREATE POLICY "Ops update tours" ON public.tours FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- bookings
DROP POLICY IF EXISTS "Staff read bookings" ON public.bookings;
CREATE POLICY "Ops read bookings" ON public.bookings FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));
DROP POLICY IF EXISTS "Staff update bookings" ON public.bookings;
CREATE POLICY "Ops update bookings" ON public.bookings FOR UPDATE TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- commissions: chỉ mở SELECT (nút "thanh toán" là UPDATE — giữ nguyên admin-only)
DROP POLICY IF EXISTS "Staff read commissions" ON public.commissions;
CREATE POLICY "Ops read commissions" ON public.commissions FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- services: Manager cũng cần đọc toàn bộ (kể cả hidden) trong /admin/services
DROP POLICY IF EXISTS "Staff read services" ON public.services;
CREATE POLICY "Ops read services" ON public.services FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- users: cho phép Manager/Staff đọc danh sách nhân viên (để hiển thị trong /admin/employees, JOIN tên nhân viên)
DROP POLICY IF EXISTS "Ops read users" ON public.users;
CREATE POLICY "Ops read users" ON public.users FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff') OR id = auth.uid());

-- =========================================================
-- Bảng role_definitions: quản lý danh sách Role hiển thị trong form tạo NV
-- (không thay app_role enum — RLS vẫn dùng admin/manager/staff)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.role_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  app_role app_role NOT NULL DEFAULT 'staff',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.role_definitions TO authenticated;
GRANT ALL ON public.role_definitions TO service_role;
ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ops read role_definitions" ON public.role_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert role_definitions" ON public.role_definitions FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "Admin delete role_definitions" ON public.role_definitions FOR DELETE TO authenticated
USING (has_role(auth.uid(),'admin') AND is_system = false);

INSERT INTO public.role_definitions (key,label,app_role,is_system) VALUES
  ('admin','Admin','admin',true),
  ('manager','Quản lý','manager',true),
  ('sale','Sale','staff',true),
  ('technician','Kỹ thuật viên','staff',true)
ON CONFLICT (key) DO NOTHING;
