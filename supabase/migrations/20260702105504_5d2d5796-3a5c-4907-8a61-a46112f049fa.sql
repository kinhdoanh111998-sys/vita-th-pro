
-- Phase 1: staff_shifts table (standalone, does not touch shift_registrations)
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('sang','chieu','ca_ngay')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, date, shift_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_shifts TO authenticated;
GRANT ALL ON public.staff_shifts TO service_role;

ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

-- Staff: manage own rows
CREATE POLICY "staff_shifts_self_select" ON public.staff_shifts
  FOR SELECT TO authenticated USING (staff_id = auth.uid());
CREATE POLICY "staff_shifts_self_insert" ON public.staff_shifts
  FOR INSERT TO authenticated WITH CHECK (staff_id = auth.uid());
CREATE POLICY "staff_shifts_self_update" ON public.staff_shifts
  FOR UPDATE TO authenticated USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
CREATE POLICY "staff_shifts_self_delete" ON public.staff_shifts
  FOR DELETE TO authenticated USING (staff_id = auth.uid());

-- Admin/Manager: full access + approval
CREATE POLICY "staff_shifts_admin_all" ON public.staff_shifts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER trg_staff_shifts_touch
  BEFORE UPDATE ON public.staff_shifts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_staff_shifts_date ON public.staff_shifts(date);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff_date ON public.staff_shifts(staff_id, date);

-- tours.staff_acceptance
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS staff_acceptance TEXT NOT NULL DEFAULT 'assigned'
  CHECK (staff_acceptance IN ('assigned','accepted','declined'));

-- notifications: schema already has recipient_id/title/body/type/ref_type/ref_id/is_read.
-- No structural change needed. Confirm indexes for realtime filter perf.
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
