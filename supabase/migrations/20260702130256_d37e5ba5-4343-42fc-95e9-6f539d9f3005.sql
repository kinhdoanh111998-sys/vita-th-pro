ALTER TABLE public.attendances
  ADD COLUMN IF NOT EXISTS early_checkout_requested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_checkout_reason TEXT,
  ADD COLUMN IF NOT EXISTS early_checkout_requested_at TIMESTAMPTZ;
