
-- Trigger-only SECURITY DEFINER functions: no direct invocation needed.
REVOKE EXECUTE ON FUNCTION public.generate_treatments_for_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_insert_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_treatments_on_paid() FROM PUBLIC, anon, authenticated;

-- RPCs called by signed-in staff: revoke broad grants, keep authenticated only.
REVOKE EXECUTE ON FUNCTION public.fn_check_in(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_check_out(uuid, text) FROM PUBLIC, anon;
