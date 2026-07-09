// Payroll shared logic — 7-tier dynamic salary + gamification thresholds.
// Used by both admin (commissions) and staff portal (dashboard widgets).

export const MIN_SHIFTS_FOR_OT = 56; // 28 ngày công chuẩn (2 ca/ngày)

export type PayrollTier = {
  id: string;
  tier_level: number;
  tier_name: string;
  min_service_revenue: number;
  base_salary: number;
  kpi_amount: number;
  allowance: number;
  ot_hourly_rate: number;
};

export type SalesCommissionTier = { min: number; percent: number };

export type PayrollSettings = {
  sales_commission_tiers: SalesCommissionTier[];
  hot_bonus_percent: number;
  hot_bonus_threshold: number;
  upsale_bonus_percent: number;
};

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  sales_commission_tiers: [
    { min: 0, percent: 8 },
    { min: 30_000_000, percent: 10 },
    { min: 80_000_000, percent: 12 },
    { min: 150_000_000, percent: 15 },
  ],
  hot_bonus_percent: 2,
  hot_bonus_threshold: 20_000_000,
  upsale_bonus_percent: 3,
};

/** Chọn bậc lương cao nhất mà doanh số dịch vụ đạt được. */
export function pickTier(
  serviceRevenue: number,
  tiers: PayrollTier[],
): PayrollTier | null {
  const sorted = [...tiers].sort((a, b) => a.tier_level - b.tier_level);
  let picked: PayrollTier | null = null;
  for (const t of sorted) {
    if (serviceRevenue >= Number(t.min_service_revenue)) picked = t;
  }
  return picked ?? sorted[0] ?? null;
}

/** Bậc kế tiếp — dùng để hiển thị "còn X nữa lên Bậc N+1". */
export function nextTier(
  currentLevel: number,
  tiers: PayrollTier[],
): PayrollTier | null {
  return (
    [...tiers]
      .sort((a, b) => a.tier_level - b.tier_level)
      .find((t) => t.tier_level > currentLevel) ?? null
  );
}

/** % hoa hồng bán hàng theo doanh số sản phẩm. */
export function pickSalesPercent(
  productRevenue: number,
  tiers: SalesCommissionTier[],
): number {
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let pct = sorted[0]?.percent ?? 0;
  for (const t of sorted) {
    if (productRevenue >= Number(t.min)) pct = Number(t.percent);
  }
  return pct;
}

export type PayrollBreakdown = {
  tier: PayrollTier | null;
  shifts: number;
  otHours: number;
  serviceRevenue: number;
  productRevenue: number;
  basePay: number;
  kpiBonus: number;
  allowance: number;
  otSalary: number;
  otLocked: boolean;
  salesCommission: number;
  salesPercent: number;
  serviceCommission: number;
  hotBonus: number;
  upsaleBonus: number;
  tierBonus: number; // bonus_tiers cũ (giữ tương thích)
  total: number;
};

export function computePayroll(input: {
  shifts: number;
  otHours: number;
  serviceRevenue: number;
  productRevenue: number;
  serviceCommission?: number; // hoa hồng KTV từ bảng commissions
  tierBonus?: number; // mốc thưởng bonus_tiers cũ
  tiers: PayrollTier[];
  settings: PayrollSettings;
}): PayrollBreakdown {
  const tier = pickTier(input.serviceRevenue, input.tiers);
  const ratio = Math.min(1, input.shifts / MIN_SHIFTS_FOR_OT);
  const basePay = tier ? Math.round(Number(tier.base_salary) * ratio) : 0;
  const allowance = tier ? Math.round(Number(tier.allowance) * ratio) : 0;
  const kpiEligible = input.shifts >= MIN_SHIFTS_FOR_OT;
  const kpiBonus = kpiEligible && tier ? Number(tier.kpi_amount) : 0;
  const otLocked = !kpiEligible;
  const otSalary =
    !otLocked && tier ? Math.round(input.otHours * Number(tier.ot_hourly_rate)) : 0;

  const salesPercent = pickSalesPercent(
    input.productRevenue,
    input.settings.sales_commission_tiers,
  );
  const salesCommission = Math.round((input.productRevenue * salesPercent) / 100);
  const hotBonus =
    input.productRevenue >= Number(input.settings.hot_bonus_threshold)
      ? Math.round(
          (input.productRevenue * Number(input.settings.hot_bonus_percent)) / 100,
        )
      : 0;
  const upsaleBonus = 0; // TODO: gắn cờ upsale ở order_items sau

  const serviceCommission = Math.round(input.serviceCommission ?? 0);
  const tierBonus = Math.round(input.tierBonus ?? 0);

  const total =
    basePay +
    allowance +
    kpiBonus +
    otSalary +
    salesCommission +
    serviceCommission +
    hotBonus +
    upsaleBonus +
    tierBonus;

  return {
    tier,
    shifts: input.shifts,
    otHours: input.otHours,
    serviceRevenue: input.serviceRevenue,
    productRevenue: input.productRevenue,
    basePay,
    kpiBonus,
    allowance,
    otSalary,
    otLocked,
    salesCommission,
    salesPercent,
    serviceCommission,
    hotBonus,
    upsaleBonus,
    tierBonus,
    total,
  };
}

export const formatVND = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
