
DROP POLICY IF EXISTS "Cho phép xem order_items" ON public.order_items;

ALTER FUNCTION public.generate_treatments_on_insert_paid() SET search_path = public;
ALTER FUNCTION public.deduct_inventory_on_paid() SET search_path = public;
ALTER FUNCTION public.generate_treatments_on_paid() SET search_path = public;
