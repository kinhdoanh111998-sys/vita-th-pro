
DROP POLICY IF EXISTS "Anyone can submit booking" ON public.bookings;
CREATE POLICY "Anyone can submit booking"
  ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(customer_name) BETWEEN 1 AND 100
    AND length(phone) BETWEEN 1 AND 20
    AND (note IS NULL OR length(note) <= 1000)
  );

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;
CREATE POLICY "Anyone can submit contact"
  ON public.contacts FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(phone) BETWEEN 1 AND 20
    AND (content IS NULL OR length(content) <= 1000)
  );
