
-- =========================================================
-- 1) news_comments: tách contact_info sang bảng riêng chỉ admin/staff đọc
-- =========================================================
CREATE TABLE IF NOT EXISTS public.news_comment_contacts (
  comment_id uuid PRIMARY KEY REFERENCES public.news_comments(id) ON DELETE CASCADE,
  contact_info text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.news_comment_contacts TO anon, authenticated;
GRANT ALL ON public.news_comment_contacts TO service_role;

ALTER TABLE public.news_comment_contacts ENABLE ROW LEVEL SECURITY;

-- Chỉ admin/staff mới đọc được thông tin liên hệ
CREATE POLICY "ncc_read_ops" ON public.news_comment_contacts
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)
  );

-- Bất kỳ ai gửi bình luận đều có thể đính kèm liên hệ cho comment đang pending
CREATE POLICY "ncc_public_insert" ON public.news_comment_contacts
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.news_comments c
       WHERE c.id = comment_id AND c.status = 'pending'
    )
  );

-- Admin/staff có thể sửa/xoá
CREATE POLICY "ncc_ops_manage" ON public.news_comment_contacts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "ncc_ops_delete" ON public.news_comment_contacts
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Backfill dữ liệu hiện có
INSERT INTO public.news_comment_contacts (comment_id, contact_info)
SELECT id, contact_info
  FROM public.news_comments
 WHERE contact_info IS NOT NULL AND btrim(contact_info) <> ''
ON CONFLICT (comment_id) DO NOTHING;

-- Xoá cột nhạy cảm khỏi bảng public
ALTER TABLE public.news_comments DROP COLUMN IF EXISTS contact_info;

-- =========================================================
-- 2) role_definitions: chỉ admin mới được INSERT
-- =========================================================
DROP POLICY IF EXISTS "Admin insert role_definitions" ON public.role_definitions;
CREATE POLICY "Admin insert role_definitions" ON public.role_definitions
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 3) fn_check_in / fn_check_out: siết EXECUTE
--    Các hàm này bắt buộc SECURITY DEFINER (nhân viên không có INSERT trực tiếp
--    vào attendances). Bên trong hàm đã bắt buộc auth.uid() + kiểm tra ca đã
--    được duyệt. Ta thu hồi EXECUTE của PUBLIC/anon để tránh gọi ẩn danh và
--    chỉ giữ EXECUTE cho authenticated.
-- =========================================================
REVOKE ALL ON FUNCTION public.fn_check_in(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_check_out(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_check_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_check_out(uuid, text) TO authenticated;
