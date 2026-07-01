
DROP POLICY "reg public insert" ON public.event_registrations;
CREATE POLICY "reg public insert" ON public.event_registrations FOR INSERT
  WITH CHECK (
    length(btrim(full_name)) BETWEEN 2 AND 100
    AND length(btrim(phone)) BETWEEN 6 AND 20
    AND (email IS NULL OR length(email) <= 200)
  );
