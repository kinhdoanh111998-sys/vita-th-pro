
DROP VIEW IF EXISTS public.community_feed;

CREATE VIEW public.community_feed
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.title,
  e.cover_url,
  e.category,
  NULL::text AS summary,
  e.start_at,
  e.end_at,
  e.created_at,
  'event'::text AS post_type
FROM public.events e
UNION ALL
SELECT
  n.id,
  n.title,
  n.cover_url,
  n.category,
  n.summary,
  NULL::timestamptz AS start_at,
  NULL::timestamptz AS end_at,
  COALESCE(n.published_at, n.created_at) AS created_at,
  'news'::text AS post_type
FROM public.news n;

GRANT SELECT ON public.community_feed TO anon, authenticated;
