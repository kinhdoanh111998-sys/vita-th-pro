ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Đang chăm sóc',
  ADD COLUMN IF NOT EXISTS note text;

UPDATE public.customers
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;

CREATE OR REPLACE FUNCTION public.customers_sync_name_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS NULL OR btrim(NEW.full_name) = '' THEN
    NEW.full_name := NEW.name;
  END IF;

  IF NEW.name IS NULL OR btrim(NEW.name) = '' THEN
    NEW.name := NEW.full_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_sync_name_fields_trigger ON public.customers;
CREATE TRIGGER customers_sync_name_fields_trigger
BEFORE INSERT OR UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.customers_sync_name_fields();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Auth can read customers'
  ) THEN
    CREATE POLICY "Auth can read customers"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Auth can insert customers'
  ) THEN
    CREATE POLICY "Auth can insert customers"
    ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Auth can update customers'
  ) THEN
    CREATE POLICY "Auth can update customers"
    ON public.customers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'Auth can delete customers'
  ) THEN
    CREATE POLICY "Auth can delete customers"
    ON public.customers
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
END $$;