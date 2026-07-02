
DROP POLICY IF EXISTS "Staff read role_definitions" ON public.role_definitions;
CREATE POLICY "Admin manager read role_definitions" ON public.role_definitions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

DROP POLICY IF EXISTS "shifts_select_authenticated" ON public.shifts;
CREATE POLICY "shifts_select_ops" ON public.shifts
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );

CREATE UNIQUE INDEX IF NOT EXISTS news_comment_contacts_comment_id_uniq
  ON public.news_comment_contacts(comment_id);

DROP POLICY IF EXISTS "ncc_public_insert" ON public.news_comment_contacts;
CREATE POLICY "ncc_recent_insert" ON public.news_comment_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.news_comments c
      WHERE c.id = news_comment_contacts.comment_id
        AND c.status = 'pending'
        AND c.created_at > now() - interval '5 minutes'
    )
  );
