
CREATE TABLE public.system_bank_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  bank_bin text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_bank_settings TO authenticated;
GRANT ALL ON public.system_bank_settings TO service_role;

ALTER TABLE public.system_bank_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read bank settings"
  ON public.system_bank_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin insert bank settings"
  ON public.system_bank_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update bank settings"
  ON public.system_bank_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete bank settings"
  ON public.system_bank_settings FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_system_bank_settings_updated_at
  BEFORE UPDATE ON public.system_bank_settings
  FOR EACH ROW EXECUTE FUNCTION public.system_settings_touch_updated_at();

-- Migrate existing bank data
INSERT INTO public.system_bank_settings (bank_name, bank_account_number, bank_account_holder, bank_bin, updated_at)
SELECT bank_name, bank_account_number, bank_account_holder, bank_bin, now()
FROM public.system_settings
WHERE bank_name IS NOT NULL
   OR bank_account_number IS NOT NULL
   OR bank_account_holder IS NOT NULL
   OR bank_bin IS NOT NULL
LIMIT 1;

-- Remove sensitive bank fields from the publicly-readable system_settings table
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS bank_name;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS bank_account_number;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS bank_account_holder;
ALTER TABLE public.system_settings DROP COLUMN IF EXISTS bank_bin;
