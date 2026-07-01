
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS short_description text DEFAULT '';

DROP VIEW IF EXISTS public.services_public;

CREATE VIEW public.services_public
WITH (security_invoker = true) AS
SELECT id, name, description, features, short_description, price, sale_price, default_sessions,
       image_url, image_urls, sku, type, category, stock_quantity, is_hidden, created_at
FROM public.services;

GRANT SELECT ON public.services_public TO anon, authenticated;
