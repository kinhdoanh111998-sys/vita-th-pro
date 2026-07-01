
-- Phase 3: Cho phép khách hàng xem liệu trình (chứa mã QR) của chính họ
CREATE POLICY "Customers read own treatments"
ON public.treatments FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers
    WHERE email = (auth.jwt() ->> 'email')
  )
);

-- Cho phép khách hàng xem đơn hàng của họ (để lấy tên dịch vụ)
CREATE POLICY "Customers read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers
    WHERE email = (auth.jwt() ->> 'email')
  )
);
