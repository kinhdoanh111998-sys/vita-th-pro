
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_insert_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vouchers_uppercase_code() FROM PUBLIC, anon, authenticated;
