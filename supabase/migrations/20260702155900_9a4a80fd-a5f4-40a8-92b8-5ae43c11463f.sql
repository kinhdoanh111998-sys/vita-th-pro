
-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions from public/anon/authenticated.
-- These are only invoked by triggers and should not be callable via the API.
REVOKE EXECUTE ON FUNCTION public.system_settings_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_for_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_insert_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.customers_sync_name_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vouchers_uppercase_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_news_published_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.attendances_auto_ot() FROM PUBLIC, anon, authenticated;
