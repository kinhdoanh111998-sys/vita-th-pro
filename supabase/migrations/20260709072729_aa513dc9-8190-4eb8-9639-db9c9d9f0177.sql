-- Drop public SELECT on event_registrations (contact info exposure)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_registrations;

-- Drop redundant permissive INSERT policy (WITH CHECK true) on event_registrations;
-- "reg public insert" already governs inserts with proper validation.
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.event_registrations;

-- Pin search_path on the remaining function
ALTER FUNCTION public.fn_auto_checkout_overdue_shifts() SET search_path = public;