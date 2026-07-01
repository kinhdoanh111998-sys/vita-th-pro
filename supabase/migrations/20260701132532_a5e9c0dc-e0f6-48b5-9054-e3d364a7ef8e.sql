ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category text;

DROP VIEW IF EXISTS public.services_public;
CREATE VIEW public.services_public
WITH (security_invoker = true) AS
SELECT
  id, name, description, price, sale_price, default_sessions,
  image_url, image_urls, sku, type, category, is_hidden, created_at
FROM public.services;

GRANT SELECT ON public.services_public TO anon, authenticated;