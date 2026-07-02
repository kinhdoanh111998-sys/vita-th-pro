-- 1. Batch requests table
CREATE TABLE IF NOT EXISTS public.shift_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  month VARCHAR(7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  review_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_staff_month UNIQUE (staff_id, month),
  CONSTRAINT shift_approval_requests_status_check CHECK (status IN ('pending','approved','rejected'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_approval_requests TO authenticated;
GRANT ALL ON public.shift_approval_requests TO service_role;

ALTER TABLE public.shift_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own requests"
  ON public.shift_approval_requests FOR SELECT TO authenticated
  USING (auth.uid() = staff_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Staff insert own requests"
  ON public.shift_approval_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff delete own pending requests"
  ON public.shift_approval_requests FOR DELETE TO authenticated
  USING (auth.uid() = staff_id AND status = 'pending');

CREATE POLICY "Admin/Manager update requests"
  ON public.shift_approval_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER trg_shift_approval_requests_updated_at
  BEFORE UPDATE ON public.shift_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Link staff_shifts to batches
ALTER TABLE public.staff_shifts
  ADD COLUMN IF NOT EXISTS request_batch_id UUID REFERENCES public.shift_approval_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_shifts_request_batch_id ON public.staff_shifts(request_batch_id);
CREATE INDEX IF NOT EXISTS idx_shift_approval_requests_status ON public.shift_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_approval_requests_month ON public.shift_approval_requests(month);
