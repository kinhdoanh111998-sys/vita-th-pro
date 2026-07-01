
DROP VIEW IF EXISTS public.services_public CASCADE;
CREATE VIEW public.services_public
WITH (security_invoker = true)
AS
SELECT
  id, name, description, price, sale_price, default_sessions,
  image_url, image_urls, sku, type, category, stock_quantity,
  is_hidden, created_at
FROM public.services
WHERE is_hidden = false;

GRANT SELECT ON public.services_public TO anon, authenticated;
