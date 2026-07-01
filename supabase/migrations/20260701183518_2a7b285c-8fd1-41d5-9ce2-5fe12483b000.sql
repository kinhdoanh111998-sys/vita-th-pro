
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.banners SET image_url = image WHERE image_url IS NULL AND image IS NOT NULL;

CREATE INDEX IF NOT EXISTS banners_active_sort_idx
  ON public.banners (is_active, sort_order);
