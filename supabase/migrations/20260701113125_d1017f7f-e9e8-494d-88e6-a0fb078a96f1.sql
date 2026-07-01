
-- Add type column (product | service) and multi-image storage
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- Constrain type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_type_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_type_check CHECK (type IN ('product','service'));
  END IF;
END$$;

-- Backfill image_urls from legacy image_url column (only when empty)
UPDATE public.services
SET image_urls = ARRAY[image_url]
WHERE (image_urls IS NULL OR array_length(image_urls,1) IS NULL)
  AND image_url IS NOT NULL
  AND image_url <> '';
