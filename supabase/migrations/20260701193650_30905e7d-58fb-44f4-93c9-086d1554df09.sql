
ALTER TABLE public.news ALTER COLUMN published_at SET DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.update_news_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.published_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_news_time ON public.news;
CREATE TRIGGER trigger_update_news_time
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_news_published_at();
