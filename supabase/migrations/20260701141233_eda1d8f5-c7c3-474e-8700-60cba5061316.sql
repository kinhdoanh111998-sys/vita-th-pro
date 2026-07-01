CREATE OR REPLACE VIEW public.services_public AS
SELECT id, name, description, price, sale_price, default_sessions,
       image_url, image_urls, sku, type, category, stock_quantity, is_hidden, created_at, features
FROM public.services
WHERE is_hidden = false;
GRANT SELECT ON public.services_public TO anon, authenticated;