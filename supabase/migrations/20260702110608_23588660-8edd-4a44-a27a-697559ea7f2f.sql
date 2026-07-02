
-- Allow assigned technician to read and update their own tours (staff_acceptance workflow)
CREATE POLICY "Technician read own tours" ON public.tours
FOR SELECT TO authenticated
USING (technician_id = auth.uid());

CREATE POLICY "Technician update own tours" ON public.tours
FOR UPDATE TO authenticated
USING (technician_id = auth.uid())
WITH CHECK (technician_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
