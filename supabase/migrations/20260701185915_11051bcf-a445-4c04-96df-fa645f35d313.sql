
-- NEWS TABLE
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  cover_url text,
  summary text,
  content_rich text,
  category text NOT NULL DEFAULT 'Kiến thức chăm sóc da',
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_public_read" ON public.news
  FOR SELECT TO anon, authenticated
  USING (published_at IS NULL OR published_at <= now());

CREATE POLICY "news_admin_insert" ON public.news
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "news_admin_update" ON public.news
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "news_admin_delete" ON public.news
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE TRIGGER trg_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.system_settings_touch_updated_at();

-- NEWS COMMENTS TABLE
CREATE TABLE public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  contact_info text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_comments_news_id ON public.news_comments(news_id);
CREATE INDEX idx_news_comments_status ON public.news_comments(status);

GRANT SELECT, INSERT ON public.news_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_comments TO authenticated;
GRANT ALL ON public.news_comments TO service_role;

ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

-- Public: only see approved
CREATE POLICY "comments_public_read_approved" ON public.news_comments
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- Anyone can insert, status is forced to pending
CREATE POLICY "comments_public_insert" ON public.news_comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND char_length(btrim(full_name)) BETWEEN 2 AND 100
    AND char_length(btrim(content)) BETWEEN 2 AND 1000
  );

CREATE POLICY "comments_admin_update" ON public.news_comments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "comments_admin_delete" ON public.news_comments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_comments;
