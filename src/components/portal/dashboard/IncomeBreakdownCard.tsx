import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, Lock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import {
  computePayroll,
  DEFAULT_PAYROLL_SETTINGS,
  formatVND,
  MIN_SHIFTS_FOR_OT,
  type PayrollTier,
  type PayrollSettings,
} from "@/lib/payroll";

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function IncomeBreakdownCard() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const r = monthRange();

  const tiersQ = useQuery({
    queryKey: ["payroll-tiers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payroll_tiers")
        .select("*")
        .order("tier_level");
      return ((data ?? []) as unknown as PayrollTier[]);
    },
  });

  const settingsQ = useQuery({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payroll_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (!data) return DEFAULT_PAYROLL_SETTINGS;
      return {
        sales_commission_tiers: (data as { sales_commission_tiers?: unknown })
          .sales_commission_tiers as PayrollSettings["sales_commission_tiers"],
        hot_bonus_percent: Number((data as { hot_bonus_percent?: number }).hot_bonus_percent ?? 0),
        hot_bonus_threshold: Number((data as { hot_bonus_threshold?: number }).hot_bonus_threshold ?? 0),
        upsale_bonus_percent: Number((data as { upsale_bonus_percent?: number }).upsale_bonus_percent ?? 0),
      } as PayrollSettings;
    },
  });

  const attQ = useQuery({
    queryKey: ["portal-income-att", uid, r.startDate],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("attendances")
        .select("check_in_approved, ot_approved, ot_hours")
        .eq("employee_id", uid!)
        .gte("date", r.startDate)
        .lt("date", r.endDate);
      return data ?? [];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["portal-income-orders", uid, r.startISO],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_items(item_type, quantity, price)")
        .eq("sales_staff_id", uid!)
        .eq("status", "paid")
        .gte("created_at", r.startISO)
        .lt("created_at", r.endISO);
      return data ?? [];
    },
  });

  const commQ = useQuery({
    queryKey: ["portal-income-comm", uid, r.startISO],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("commissions")
        .select("amount, commission_type")
        .eq("staff_id", uid!)
        .gte("created_at", r.startISO)
        .lt("created_at", r.endISO);
      return data ?? [];
    },
  });

  const breakdown = useMemo(() => {
    const atts = attQ.data ?? [];
    const shifts = atts.filter((a) => a.check_in_approved).length;
    const otHours = atts
      .filter((a) => a.ot_approved)
      .reduce((s, a) => s + Number(a.ot_hours ?? 0), 0);

    let serviceRevenue = 0;
    let productRevenue = 0;
    (ordersQ.data ?? []).forEach((o: { order_items?: unknown }) => {
      const items = (o.order_items ?? []) as Array<{
        item_type?: string;
        quantity?: number;
        price?: number;
      }>;
      items.forEach((it) => {
        const amt = Number(it.price ?? 0) * Number(it.quantity ?? 1);
        if (it.item_type === "service") serviceRevenue += amt;
        else if (it.item_type === "product") productRevenue += amt;
      });
    });

    const serviceCommission = (commQ.data ?? [])
      .filter(
        (c) =>
          c.commission_type === "service" ||
          c.commission_type === "tour_service",
      )
      .reduce((s, c) => s + Number(c.amount ?? 0), 0);

    return computePayroll({
      shifts,
      otHours,
      serviceRevenue,
      productRevenue,
      serviceCommission,
      tiers: tiersQ.data ?? [],
      settings: settingsQ.data ?? DEFAULT_PAYROLL_SETTINGS,
    });
  }, [attQ.data, ordersQ.data, commQ.data, tiersQ.data, settingsQ.data]);

  const rows: { label: string; value: number; hint?: string; locked?: boolean }[] = [
    {
      label: "Lương cơ bản (theo bậc)",
      value: breakdown.basePay,
      hint: breakdown.tier?.tier_name ?? "—",
    },
    { label: "Phụ cấp", value: breakdown.allowance },
    {
      label: "KPI Bonus",
      value: breakdown.kpiBonus,
      locked: breakdown.otLocked,
      hint: breakdown.otLocked ? `Cần đủ ${MIN_SHIFTS_FOR_OT} ca` : undefined,
    },
    {
      label: `Lương OT (${breakdown.otHours.toFixed(1)}h)`,
      value: breakdown.otSalary,
      locked: breakdown.otLocked,
      hint: breakdown.otLocked
        ? `Chưa mở khoá (${breakdown.shifts}/${MIN_SHIFTS_FOR_OT} ca)`
        : undefined,
    },
    {
      label: `Hoa hồng bán hàng (${breakdown.salesPercent}%)`,
      value: breakdown.salesCommission,
    },
    { label: "Hoa hồng dịch vụ", value: breakdown.serviceCommission },
    { label: "Thưởng nóng", value: breakdown.hotBonus },
  ];

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 grid place-items-center text-emerald-700">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark">Thu nhập dự kiến tháng</h3>
          <p className="text-xs text-ink-muted">
            Tổng hợp lương + hoa hồng + thưởng đến hiện tại.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4 mb-3">
        <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Tổng dự kiến
        </div>
        <div className="text-3xl font-black text-emerald-700 mt-1">
          {formatVND(breakdown.total)}
        </div>
      </div>

      <div className="space-y-1.5">
        {rows.map((r2) => (
          <div
            key={r2.label}
            className={
              "flex items-center justify-between px-3 py-2 rounded-lg border " +
              (r2.locked
                ? "bg-slate-50 border-dashed border-slate-200 opacity-70"
                : "bg-white border-hairline")
            }
          >
            <div className="flex items-center gap-1.5 text-sm">
              {r2.locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              <span className="font-semibold text-ink">{r2.label}</span>
              {r2.hint && (
                <span className="text-[10px] text-ink-muted">· {r2.hint}</span>
              )}
            </div>
            <div className="font-black text-brand-dark">
              {formatVND(r2.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
