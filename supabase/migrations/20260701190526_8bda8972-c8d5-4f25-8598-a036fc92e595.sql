CREATE OR REPLACE VIEW public.community_feed AS
SELECT
  e.id,
  e.title,
  e.cover_url,
  e.category,
  e.created_at,
  'event'::text AS post_type
FROM public.events e
UNION ALL
SELECT
  n.id,
  n.title,
  n.cover_url,
  n.category,
  COALESCE(n.published_at, n.created_at) AS created_at,
  'news'::text AS post_type
FROM public.news n
WHERE n.published_at IS NOT NULL
ORDER BY created_at DESC;

GRANT SELECT ON public.community_feed TO anon, authenticated;