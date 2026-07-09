
CREATE TABLE IF NOT EXISTS public.payroll_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_level INT NOT NULL UNIQUE CHECK (tier_level BETWEEN 1 AND 7),
  tier_name TEXT NOT NULL,
  min_service_revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
  kpi_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  allowance NUMERIC(14,2) NOT NULL DEFAULT 0,
  ot_hourly_rate NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payroll_tiers TO authenticated;
GRANT ALL ON public.payroll_tiers TO service_role;
ALTER TABLE public.payroll_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ops read tiers" ON public.payroll_tiers FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Admin write tiers" ON public.payroll_tiers FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_payroll_tiers_updated BEFORE UPDATE ON public.payroll_tiers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.payroll_tiers (tier_level, tier_name, min_service_revenue, base_salary, kpi_amount, allowance, ot_hourly_rate) VALUES
  (1,'Bậc 1',0,5000000,0,500000,40000),
  (2,'Bậc 2',30000000,6000000,500000,600000,45000),
  (3,'Bậc 3',60000000,7000000,1000000,700000,50000),
  (4,'Bậc 4',100000000,8000000,1500000,800000,55000),
  (5,'Bậc 5',150000000,9500000,2000000,900000,60000),
  (6,'Bậc 6',220000000,11000000,3000000,1000000,70000),
  (7,'Bậc 7',300000000,13000000,5000000,1200000,80000)
ON CONFLICT (tier_level) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id=1),
  sales_commission_tiers JSONB NOT NULL DEFAULT '[{"min":0,"percent":8},{"min":30000000,"percent":10},{"min":80000000,"percent":12},{"min":150000000,"percent":15}]'::jsonb,
  hot_bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 2.0,
  hot_bonus_threshold NUMERIC(14,2) NOT NULL DEFAULT 20000000,
  upsale_bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payroll_settings TO authenticated;
GRANT ALL ON public.payroll_settings TO service_role;
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ops read payroll_settings" ON public.payroll_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role) OR has_role(auth.uid(),'staff'::app_role));
CREATE POLICY "Admin write payroll_settings" ON public.payroll_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER trg_payroll_settings_updated BEFORE UPDATE ON public.payroll_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.payroll_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payroll_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  data JSONB NOT NULL,
  totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  frozen_by UUID REFERENCES public.users(id),
  frozen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year,month)
);
GRANT SELECT ON public.payroll_snapshots TO authenticated;
GRANT ALL ON public.payroll_snapshots TO service_role;
ALTER TABLE public.payroll_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ops read snapshots" ON public.payroll_snapshots FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE POLICY "Admin write snapshots" ON public.payroll_snapshots FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
