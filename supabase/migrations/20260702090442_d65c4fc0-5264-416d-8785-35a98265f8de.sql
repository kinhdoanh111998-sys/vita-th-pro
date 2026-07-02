
-- Phase 5: Financial config tables

-- salary_configs: cấu hình lương theo role
CREATE TABLE IF NOT EXISTS public.salary_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE CHECK (role IN ('technician','sale','manager','admin','employee')),
  base_salary_per_shift numeric(14,2) NOT NULL DEFAULT 0,
  ot_hourly_rate numeric(14,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_configs TO authenticated;
GRANT ALL ON public.salary_configs TO service_role;
ALTER TABLE public.salary_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager read salary_configs" ON public.salary_configs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "Admin write salary_configs" ON public.salary_configs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update salary_configs" ON public.salary_configs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete salary_configs" ON public.salary_configs FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_salary_configs_touch BEFORE UPDATE ON public.salary_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- bonus_tiers: mốc thưởng doanh số
CREATE TABLE IF NOT EXISTS public.bonus_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL,
  target_amount numeric(14,2) NOT NULL DEFAULT 0,
  bonus_amount numeric(14,2) NOT NULL DEFAULT 0,
  bonus_type text NOT NULL DEFAULT 'total' CHECK (bonus_type IN ('product','service','total')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_tiers TO authenticated;
GRANT ALL ON public.bonus_tiers TO service_role;
ALTER TABLE public.bonus_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager read bonus_tiers" ON public.bonus_tiers FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "Admin write bonus_tiers" ON public.bonus_tiers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update bonus_tiers" ON public.bonus_tiers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete bonus_tiers" ON public.bonus_tiers FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_bonus_tiers_touch BEFORE UPDATE ON public.bonus_tiers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- affiliate_configs: hoa hồng cộng tác viên
CREATE TABLE IF NOT EXISTS public.affiliate_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL UNIQUE,
  commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  note text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_configs TO authenticated;
GRANT ALL ON public.affiliate_configs TO service_role;
ALTER TABLE public.affiliate_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager read affiliate_configs" ON public.affiliate_configs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "Admin write affiliate_configs" ON public.affiliate_configs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update affiliate_configs" ON public.affiliate_configs FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete affiliate_configs" ON public.affiliate_configs FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_affiliate_configs_touch BEFORE UPDATE ON public.affiliate_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed cấu hình mặc định
INSERT INTO public.salary_configs (role, base_salary_per_shift, ot_hourly_rate) VALUES
  ('technician', 150000, 40000),
  ('sale',       120000, 35000),
  ('manager',    250000, 60000)
ON CONFLICT (role) DO NOTHING;

INSERT INTO public.bonus_tiers (tier_name, target_amount, bonus_amount, bonus_type) VALUES
  ('Mốc 50 triệu',  50000000,  1000000, 'total'),
  ('Mốc 100 triệu', 100000000, 2500000, 'total'),
  ('Mốc 200 triệu', 200000000, 6000000, 'total')
ON CONFLICT DO NOTHING;
