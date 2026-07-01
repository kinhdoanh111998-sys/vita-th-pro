
-- Trigger cải tổ: quantity × default_sessions, bỏ qua sản phẩm
CREATE OR REPLACE FUNCTION public.generate_treatments_for_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE svc_type text; base_sessions int; total_sessions int; i int;
BEGIN
  IF NEW.status <> 'paid' OR NEW.quantity <= 0 THEN RETURN NEW; END IF;
  SELECT type, COALESCE(default_sessions, 1) INTO svc_type, base_sessions
    FROM public.services WHERE id = NEW.service_id;
  IF svc_type = 'product' THEN RETURN NEW; END IF;
  total_sessions := NEW.quantity * GREATEST(base_sessions, 1);
  FOR i IN 1..total_sessions LOOP
    INSERT INTO public.treatments (order_id, customer_id, session_number, status)
    VALUES (NEW.id, NEW.customer_id, i, 'pending');
  END LOOP;
  RETURN NEW;
END; $$;

-- TOURS
CREATE TABLE IF NOT EXISTS public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  customer_id  uuid NOT NULL REFERENCES public.customers(id)  ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES public.users(id)     ON DELETE RESTRICT,
  notes text,
  commission_amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tours_technician ON public.tours(technician_id);
CREATE INDEX IF NOT EXISTS idx_tours_treatment  ON public.tours(treatment_id);
CREATE INDEX IF NOT EXISTS idx_tours_customer   ON public.tours(customer_id);
CREATE INDEX IF NOT EXISTS idx_tours_created    ON public.tours(created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read tours" ON public.tours FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Staff insert tours" ON public.tours FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Staff update tours" ON public.tours FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Admin delete tours" ON public.tours FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- COMMISSIONS
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  commission_type text NOT NULL DEFAULT 'tour_service',
  reference_id uuid,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commissions_staff   ON public.commissions(staff_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status  ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created ON public.commissions(created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read commissions" ON public.commissions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Staff insert commissions" ON public.commissions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Admin update commissions" ON public.commissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admin delete commissions" ON public.commissions FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
