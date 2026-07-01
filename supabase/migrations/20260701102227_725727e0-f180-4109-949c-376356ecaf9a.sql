
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotline text,
  zalo_link text,
  facebook_link text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can update system settings"
  ON public.system_settings FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can insert system settings"
  ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.system_settings_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.system_settings_touch_updated_at();

INSERT INTO public.system_settings (hotline, zalo_link, facebook_link)
VALUES ('0988 000 888', 'https://zalo.me/0988000888', 'https://facebook.com/vitathpro');
