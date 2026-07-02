
-- ============ PHASE 4: Bookings, Tours, Notifications ============

-- 1) BOOKINGS: thêm cột chuẩn (giữ nguyên cột legacy để không phá dữ liệu cũ)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Backfill booking_at từ booking_date + booking_time (Asia/Ho_Chi_Minh) khi trống
UPDATE public.bookings
   SET booking_at = ((booking_date::text || ' ' || COALESCE(booking_time::text,'00:00'))::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
 WHERE booking_at IS NULL AND booking_date IS NOT NULL;

-- Normalize status: cho phép cả legacy + enum-like (pending/confirmed/completed/cancelled)
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending','confirmed','completed','cancelled','Chờ xác nhận','Đã xác nhận','Hoàn thành','Đã hủy')) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_bookings_booking_at ON public.bookings(booking_at);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_staff ON public.bookings(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 2) TOURS: bổ sung start/end time; mở rộng status
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- default 'completed' -> để 'in_progress' được khởi tạo khi kéo thả
ALTER TABLE public.tours ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.tours ALTER COLUMN status SET DEFAULT 'in_progress';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_status_check') THEN
    ALTER TABLE public.tours
      ADD CONSTRAINT tours_status_check CHECK (status IN ('in_progress','completed','cancelled')) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);

-- 3) NOTIFICATIONS: bảng log thông báo cho App Nhân viên
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  type text NOT NULL,             -- 'booking_cancelled' | 'booking_reassigned' | 'tour_assigned' | ...
  title text NOT NULL,
  body text,
  ref_type text,                  -- 'booking' | 'tour' | 'treatment'
  ref_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own_or_ops" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "notifications_insert_ops" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
