
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.fn_check_in(uuid) SECURITY INVOKER;
ALTER FUNCTION public.fn_check_out(uuid, text) SECURITY INVOKER;
