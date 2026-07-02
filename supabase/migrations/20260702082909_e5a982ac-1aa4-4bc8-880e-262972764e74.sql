
-- ==========================================================
-- PHASE 3: SHIFTS / REGISTRATIONS / ATTENDANCES + RPC BẢO MẬT
-- ==========================================================

DO $$ BEGIN
  CREATE TYPE public.shift_registration_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- shifts ----------
CREATE TABLE IF NOT EXISTS public.shifts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  start_time   time        NOT NULL,
  end_time     time        NOT NULL,
  description  text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shifts_select_authenticated" ON public.shifts;
CREATE POLICY "shifts_select_authenticated" ON public.shifts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "shifts_write_admin_manager" ON public.shifts;
CREATE POLICY "shifts_write_admin_manager" ON public.shifts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP TRIGGER IF EXISTS trg_shifts_touch ON public.shifts;
CREATE TRIGGER trg_shifts_touch BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- shift_registrations ----------
CREATE TABLE IF NOT EXISTS public.shift_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shift_id      uuid NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
  date          date NOT NULL,
  status        public.shift_registration_status NOT NULL DEFAULT 'pending',
  approved_by   uuid REFERENCES public.users(id),
  approved_at   timestamptz,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, shift_id, date)
);
CREATE INDEX IF NOT EXISTS idx_shift_reg_emp_date ON public.shift_registrations(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_shift_reg_date     ON public.shift_registrations(date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shift_registrations TO authenticated;
GRANT ALL ON public.shift_registrations TO service_role;
ALTER TABLE public.shift_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shift_reg_select_own_or_manager" ON public.shift_registrations;
CREATE POLICY "shift_reg_select_own_or_manager" ON public.shift_registrations
  FOR SELECT TO authenticated USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'manager')
  );

DROP POLICY IF EXISTS "shift_reg_insert_self" ON public.shift_registrations;
CREATE POLICY "shift_reg_insert_self" ON public.shift_registrations
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "shift_reg_update_own_pending" ON public.shift_registrations;
CREATE POLICY "shift_reg_update_own_pending" ON public.shift_registrations
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending')
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "shift_reg_manage_admin_manager" ON public.shift_registrations;
CREATE POLICY "shift_reg_manage_admin_manager" ON public.shift_registrations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP TRIGGER IF EXISTS trg_shift_reg_touch ON public.shift_registrations;
CREATE TRIGGER trg_shift_reg_touch BEFORE UPDATE ON public.shift_registrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- attendances ----------
CREATE TABLE IF NOT EXISTS public.attendances (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date                 date NOT NULL,
  shift_id             uuid REFERENCES public.shifts(id),
  check_in_time        timestamptz,
  check_out_time       timestamptz,
  check_in_approved    boolean NOT NULL DEFAULT false,
  check_in_approved_by uuid REFERENCES public.users(id),
  check_in_approved_at timestamptz,
  ot_hours             numeric(5,2) NOT NULL DEFAULT 0,
  ot_approved          boolean NOT NULL DEFAULT false,
  ot_approved_by       uuid REFERENCES public.users(id),
  ot_approved_at       timestamptz,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);
CREATE INDEX IF NOT EXISTS idx_att_emp_date ON public.attendances(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_att_date     ON public.attendances(date);
GRANT SELECT ON public.attendances TO authenticated;                  -- CHỈ đọc
GRANT INSERT, UPDATE, DELETE ON public.attendances TO service_role;   -- Ghi đi qua RPC / admin
GRANT ALL ON public.attendances TO service_role;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Nhân viên đọc bản ghi của mình; manager/admin đọc tất cả
DROP POLICY IF EXISTS "att_select_own_or_manager" ON public.attendances;
CREATE POLICY "att_select_own_or_manager" ON public.attendances
  FOR SELECT TO authenticated USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'manager')
  );

-- CHỈ admin/manager mới được ghi trực tiếp (nhân viên đi qua RPC SECURITY DEFINER)
DROP POLICY IF EXISTS "att_manage_admin_manager" ON public.attendances;
CREATE POLICY "att_manage_admin_manager" ON public.attendances
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

DROP TRIGGER IF EXISTS trg_att_touch ON public.attendances;
CREATE TRIGGER trg_att_touch BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- Trigger tự tính OT ----------
CREATE OR REPLACE FUNCTION public.attendances_auto_ot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE s_end time; end_ts timestamptz; diff_hours numeric;
BEGIN
  IF NEW.check_out_time IS NULL OR NEW.shift_id IS NULL THEN RETURN NEW; END IF;
  SELECT end_time INTO s_end FROM public.shifts WHERE id = NEW.shift_id;
  IF s_end IS NULL THEN RETURN NEW; END IF;
  end_ts := (NEW.date + s_end) AT TIME ZONE 'Asia/Ho_Chi_Minh';
  diff_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - end_ts)) / 3600.0;
  IF diff_hours > 0 AND COALESCE(NEW.ot_hours,0) = 0 THEN
    NEW.ot_hours := round(diff_hours * 4) / 4.0;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_att_auto_ot ON public.attendances;
CREATE TRIGGER trg_att_auto_ot
  BEFORE INSERT OR UPDATE OF check_out_time ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.attendances_auto_ot();

-- ==========================================================
-- RPC BẢO MẬT: fn_check_in / fn_check_out
-- ==========================================================

-- fn_check_in: nhân viên tự check-in vào ca đã được duyệt trong hôm nay
CREATE OR REPLACE FUNCTION public.fn_check_in(p_shift_id uuid)
RETURNS public.attendances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_row public.attendances;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.shift_registrations
     WHERE employee_id = v_uid AND shift_id = p_shift_id
       AND date = v_today AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Ca chưa được duyệt cho hôm nay';
  END IF;

  IF EXISTS (SELECT 1 FROM public.attendances WHERE employee_id = v_uid AND date = v_today) THEN
    RAISE EXCEPTION 'Bạn đã check-in hôm nay';
  END IF;

  INSERT INTO public.attendances (employee_id, date, shift_id, check_in_time)
  VALUES (v_uid, v_today, p_shift_id, now())
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.fn_check_in(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_check_in(uuid) TO authenticated;

-- fn_check_out: nhân viên check-out bản ghi chấm công hôm nay của chính mình
CREATE OR REPLACE FUNCTION public.fn_check_out(p_attendance_id uuid, p_notes text DEFAULT NULL)
RETURNS public.attendances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.attendances;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;

  SELECT * INTO v_row FROM public.attendances WHERE id = p_attendance_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy bản ghi chấm công'; END IF;
  IF v_row.employee_id <> v_uid THEN RAISE EXCEPTION 'Không có quyền'; END IF;
  IF NOT v_row.check_in_approved THEN RAISE EXCEPTION 'Chưa được duyệt check-in'; END IF;
  IF v_row.check_out_time IS NOT NULL THEN RAISE EXCEPTION 'Đã check-out'; END IF;

  UPDATE public.attendances
     SET check_out_time = now(),
         notes = COALESCE(p_notes, notes)
   WHERE id = p_attendance_id
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION public.fn_check_out(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_check_out(uuid, text) TO authenticated;
