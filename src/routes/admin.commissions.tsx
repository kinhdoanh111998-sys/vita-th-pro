import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Save, Plus, Trash2, Loader2, Lock, Settings2, LineChart, Snowflake } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { downloadCSV, toCSV } from "@/lib/csv";
import { useAuth } from "@/lib/AuthContext";
import {
  computePayroll,
  DEFAULT_PAYROLL_SETTINGS,
  MIN_SHIFTS_FOR_OT,
  type PayrollBreakdown,
  type PayrollSettings,
  type PayrollTier,
  type SalesCommissionTier,
} from "@/lib/payroll";

export const Route = createFileRoute("/admin/commissions")({
  component: CommissionsAdmin,
});

/* ---------------- Types ---------------- */
type Staff = { id: string; full_name: string | null; role: string };
type SalaryConfig = {
  id: string;
  role: string;
  base_salary_per_shift: number;
  ot_hourly_rate: number;
  note: string | null;
};
type BonusTier = {
  id: string;
  tier_name: string;
  target_amount: number;
  bonus_amount: number;
  bonus_type: "product" | "service" | "total";
  active: boolean;
};
type AffiliateConfig = {
  id: string;
  ref_code: string;
  commission_percent: number;
  note: string | null;
  active: boolean;
};
type Attendance = {
  employee_id: string;
  date: string;
  check_in_approved: boolean;
  ot_hours: number;
  ot_approved: boolean;
};
type OrderRow = {
  id: string;
  sales_staff_id: string | null;
  total_amount: number;
  created_at: string;
};
type CommissionRow = {
  id: string;
  staff_id: string | null;
  commission_type: string | null;
  amount: number | null;
  status: string | null;
  paid_at: string | null;
  created_at: string;
};

/* ---------------- Utils ---------------- */
const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

function monthRange(y: number, m: number) {
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

const ROLE_LABEL: Record<string, string> = {
  technician: "Kỹ thuật viên",
  sale: "Sale",
  manager: "Quản lý",
  admin: "Admin",
  employee: "Nhân viên",
};

/* ================= MAIN ================= */
function CommissionsAdmin() {
  const { role } = useAuth();
  const canConfigure = role === "admin";

  return (
    <>
      <AdminTopbar
        title="Lương & Hoa hồng"
        subtitle="Cấu hình tài chính và tính lương tổng hợp theo tháng."
      />
      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="payroll" className="gap-1.5">
            <LineChart size={14} /> Bảng lương tổng hợp
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings2 size={14} /> Cấu hình
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <PayrollDashboard />
        </TabsContent>
        <TabsContent value="config">
          <ConfigPanel canConfigure={canConfigure} />
        </TabsContent>
      </Tabs>
    </>
  );
}
/* ================= TAB 1: PAYROLL ================= */
function PayrollDashboard() {
  const { role } = useAuth();
  const canFreeze = role === "admin";
  const qc = useQueryClient();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const { startISO, endISO } = useMemo(
    () => monthRange(Number(year), Number(month)),
    [year, month],
  );
  const startDate = startISO.slice(0, 10);
  const endDate = endISO.slice(0, 10);

  const staffQ = useQuery({
    queryKey: ["payroll-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,full_name,role")
        .in("role", ["technician", "sale", "manager", "admin", "employee"])
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Staff[];
    },
  });

  const tiersQ = useQuery({
    queryKey: ["payroll-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_tiers")
        .select("*")
        .order("tier_level");
      if (error) throw error;
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
      const d = data as Record<string, unknown>;
      return {
        sales_commission_tiers: (d.sales_commission_tiers as SalesCommissionTier[]) ?? DEFAULT_PAYROLL_SETTINGS.sales_commission_tiers,
        hot_bonus_percent: Number(d.hot_bonus_percent ?? 0),
        hot_bonus_threshold: Number(d.hot_bonus_threshold ?? 0),
        upsale_bonus_percent: Number(d.upsale_bonus_percent ?? 0),
      } as PayrollSettings;
    },
  });

  const attQ = useQuery({
    queryKey: ["payroll-attendances", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("employee_id,date,check_in_approved,ot_hours,ot_approved")
        .gte("date", startDate)
        .lt("date", endDate);
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
  });

  type OrderWithItems = {
    id: string;
    sales_staff_id: string | null;
    created_at: string;
    order_items: { item_type: string | null; quantity: number | null; price: number | null }[] | null;
  };
  const ordersQ = useQuery({
    queryKey: ["payroll-orders-items", startISO, endISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, sales_staff_id, created_at, order_items(item_type, quantity, price)")
        .gte("created_at", startISO)
        .lt("created_at", endISO)
        .eq("status", "paid");
      if (error) throw error;
      return (data ?? []) as unknown as OrderWithItems[];
    },
  });

  const commQ = useQuery({
    queryKey: ["payroll-commissions", startISO, endISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id,staff_id,commission_type,amount,status,paid_at,created_at")
        .gte("created_at", startISO)
        .lt("created_at", endISO);
      if (error) throw error;
      return (data ?? []) as CommissionRow[];
    },
  });

  const frozenQ = useQuery({
    queryKey: ["payroll-frozen", year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from("payroll_snapshots")
        .select("id, frozen_at, totals")
        .eq("year", Number(year))
        .eq("month", Number(month))
        .maybeSingle();
      return data ?? null;
    },
  });

  type Row = { staffId: string; name: string; role: string; breakdown: PayrollBreakdown };

  const rows = useMemo<Row[]>(() => {
    const staffs = staffQ.data ?? [];
    const atts = attQ.data ?? [];
    const orders = ordersQ.data ?? [];
    const comms = commQ.data ?? [];
    const tiers = tiersQ.data ?? [];
    const settings = settingsQ.data ?? DEFAULT_PAYROLL_SETTINGS;

    return staffs.map((s) => {
      const myAtts = atts.filter((a) => a.employee_id === s.id);
      const shifts = myAtts.filter((a) => a.check_in_approved).length;
      const otHours = myAtts
        .filter((a) => a.ot_approved)
        .reduce((sum, a) => sum + Number(a.ot_hours ?? 0), 0);

      let serviceRevenue = 0;
      let productRevenue = 0;
      orders
        .filter((o) => o.sales_staff_id === s.id)
        .forEach((o) => {
          (o.order_items ?? []).forEach((it) => {
            const amt = Number(it.price ?? 0) * Number(it.quantity ?? 1);
            if (it.item_type === "service") serviceRevenue += amt;
            else if (it.item_type === "product") productRevenue += amt;
          });
        });

      const serviceCommission = comms
        .filter((c) => c.staff_id === s.id)
        .filter((c) => c.commission_type === "service" || c.commission_type === "tour_service")
        .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

      const breakdown = computePayroll({
        shifts,
        otHours,
        serviceRevenue,
        productRevenue,
        serviceCommission,
        tiers,
        settings,
      });

      return {
        staffId: s.id,
        name: s.full_name ?? "(chưa đặt tên)",
        role: s.role,
        breakdown,
      };
    });
  }, [staffQ.data, attQ.data, ordersQ.data, commQ.data, tiersQ.data, settingsQ.data]);

  const totals = useMemo(() => {
    return rows.reduce(
      (a, r) => {
        a.basePay += r.breakdown.basePay + r.breakdown.allowance + r.breakdown.kpiBonus;
        a.otSalary += r.breakdown.otSalary;
        a.sales += r.breakdown.salesCommission + r.breakdown.hotBonus;
        a.service += r.breakdown.serviceCommission;
        a.total += r.breakdown.total;
        return a;
      },
      { basePay: 0, otSalary: 0, sales: 0, service: 0, total: 0 },
    );
  }, [rows]);

  const isLoading =
    staffQ.isLoading || attQ.isLoading || ordersQ.isLoading || commQ.isLoading || tiersQ.isLoading;

  const freezeM = useMutation({
    mutationFn: async () => {
      const snapshot = rows.map((r) => ({
        staff_id: r.staffId,
        name: r.name,
        role: r.role,
        ...r.breakdown,
        tier_level: r.breakdown.tier?.tier_level ?? null,
      }));
      const { error } = await supabase.from("payroll_snapshots").upsert(
        {
          year: Number(year),
          month: Number(month),
          data: snapshot,
          totals: totals,
        } as never,
        { onConflict: "year,month" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Đã chốt bảng lương tháng ${month}/${year}`);
      qc.invalidateQueries({ queryKey: ["payroll-frozen", year, month] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCSV = () => {
    const csv = toCSV(
      rows.map((r) => ({
        nhanvien: r.name,
        role: ROLE_LABEL[r.role] ?? r.role,
        bac: r.breakdown.tier?.tier_name ?? "—",
        so_ca: r.breakdown.shifts,
        gio_ot: r.breakdown.otHours,
        base: r.breakdown.basePay,
        allowance: r.breakdown.allowance,
        kpi: r.breakdown.kpiBonus,
        ot: r.breakdown.otSalary,
        ds_dv: r.breakdown.serviceRevenue,
        ds_sp: r.breakdown.productRevenue,
        hh_sale: r.breakdown.salesCommission,
        hh_dv: r.breakdown.serviceCommission,
        hot: r.breakdown.hotBonus,
        tong: r.breakdown.total,
      })),
      [
        { key: "nhanvien", label: "Nhân viên" },
        { key: "role", label: "Vai trò" },
        { key: "bac", label: "Bậc" },
        { key: "so_ca", label: "Số ca" },
        { key: "gio_ot", label: "Giờ OT" },
        { key: "base", label: "Lương cơ bản" },
        { key: "allowance", label: "Phụ cấp" },
        { key: "kpi", label: "KPI" },
        { key: "ot", label: "OT" },
        { key: "ds_dv", label: "DS Dịch vụ" },
        { key: "ds_sp", label: "DS Sản phẩm" },
        { key: "hh_sale", label: "HH bán hàng" },
        { key: "hh_dv", label: "HH dịch vụ" },
        { key: "hot", label: "Thưởng nóng" },
        { key: "tong", label: "TỔNG" },
      ],
    );
    downloadCSV(`bang-luong-${month}-${year}.csv`, csv);
    toast.success("Đã xuất bảng lương");
  };

  const frozen = frozenQ.data;

  return (
    <>
      {/* Filters */}
      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Tháng</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>Tháng {m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Năm</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={exportCSV} disabled={rows.length === 0}>
            <Download size={16} /> Xuất CSV
          </Button>
          {canFreeze && (
            <Button
              variant="outline"
              onClick={() => {
                if (
                  confirm(
                    frozen
                      ? `Ghi đè bảng lương đã chốt của tháng ${month}/${year}?`
                      : `Chốt bảng lương tháng ${month}/${year}? Số liệu sẽ được đóng băng.`,
                  )
                )
                  freezeM.mutate();
              }}
              disabled={freezeM.isPending || rows.length === 0}
              className="border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              <Snowflake size={16} /> {frozen ? "Ghi đè chốt lương" : "Chốt bảng lương"}
            </Button>
          )}
        </div>
      </div>

      {frozen && (
        <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 flex items-center gap-2">
          <Snowflake size={14} /> Bảng lương tháng {month}/{year} đã được chốt lúc{" "}
          {new Date(frozen.frozen_at as string).toLocaleString("vi-VN")}.
        </div>
      )}

      <p className="text-xs text-ink-muted mb-3">
        Bậc lương được xác định theo <b>doanh số dịch vụ tháng</b>. Lương cơ bản/phụ cấp prorate theo{" "}
        <b>{MIN_SHIFTS_FOR_OT} ca chuẩn</b>. <b>KPI Bonus và Lương OT</b> chỉ mở khoá khi nhân viên đủ{" "}
        {MIN_SHIFTS_FOR_OT} ca công.
      </p>

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-4 mb-4">
        <Kpi label="Lương cứng + phụ cấp + KPI" value={formatVND(totals.basePay)} />
        <Kpi label="Lương OT" value={formatVND(totals.otSalary)} />
        <Kpi label="HH bán + thưởng nóng" value={formatVND(totals.sales)} />
        <Kpi label="Tổng chi kỳ" value={formatVND(totals.total)} tone="brand" />
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead>
            <tr>
              {[
                "Nhân viên", "Vai trò", "Bậc", "Số ca", "OT", "Lương CB",
                "Phụ cấp", "KPI", "Lương OT", "DS Dịch vụ", "DS Sản phẩm",
                "HH Bán (%)", "HH DV", "Thưởng nóng", "TỔNG",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={15} className="px-3 py-10 text-center text-ink-muted">Đang tính lương…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={15} className="px-3 py-10 text-center text-ink-muted">Không có nhân viên.</td></tr>
            ) : rows.map((r) => {
              const b = r.breakdown;
              return (
                <tr key={r.staffId} className="hover:bg-brand-soft/30">
                  <td className="px-3 py-2 border-b border-[#edf3ed] font-semibold">{r.name}</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed] text-xs">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      {ROLE_LABEL[r.role] ?? r.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed] text-xs">
                    {b.tier ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {b.tier.tier_name}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">
                    <span className={b.otLocked ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                      {b.shifts}/{MIN_SHIFTS_FOR_OT}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">{b.otHours.toFixed(1)}h</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(b.basePay)}</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(b.allowance)}</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">
                    {b.otLocked ? <span className="inline-flex items-center gap-1 text-slate-400"><Lock size={12} /> —</span> : formatVND(b.kpiBonus)}
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">
                    {b.otLocked ? <span className="inline-flex items-center gap-1 text-slate-400"><Lock size={12} /> —</span> : formatVND(b.otSalary)}
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed] text-slate-600">{formatVND(b.serviceRevenue)}</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed] text-slate-600">{formatVND(b.productRevenue)}</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">
                    <div className="font-bold">{formatVND(b.salesCommission)}</div>
                    <div className="text-[10px] text-ink-muted">{b.salesPercent}%</div>
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(b.serviceCommission)}</td>
                  <td className="px-3 py-2 border-b border-[#edf3ed]">
                    {b.hotBonus > 0 ? <span className="font-bold text-amber-700">{formatVND(b.hotBonus)}</span> : "—"}
                  </td>
                  <td className="px-3 py-2 border-b border-[#edf3ed] font-black text-brand-dark">{formatVND(b.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ================= TAB 2: CONFIG ================= */
function ConfigPanel({ canConfigure }: { canConfigure: boolean }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <TierConfigSection canConfigure={canConfigure} />
      <PayrollExtrasSection canConfigure={canConfigure} />
      <SalarySection canConfigure={canConfigure} />
      <BonusTiersSection canConfigure={canConfigure} />
      <AffiliateSection canConfigure={canConfigure} />
    </div>
  );
}

/* ---- 7-tier salary config ---- */
function TierConfigSection({ canConfigure }: { canConfigure: boolean }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["payroll-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payroll_tiers").select("*").order("tier_level");
      if (error) throw error;
      return ((data ?? []) as unknown as PayrollTier[]);
    },
  });

  const saveM = useMutation({
    mutationFn: async (r: PayrollTier) => {
      const { error } = await supabase
        .from("payroll_tiers")
        .update({
          tier_name: r.tier_name,
          min_service_revenue: r.min_service_revenue,
          base_salary: r.base_salary,
          kpi_amount: r.kpi_amount,
          allowance: r.allowance,
          ot_hourly_rate: r.ot_hourly_rate,
        } as never)
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã lưu bậc lương");
      qc.invalidateQueries({ queryKey: ["payroll-tiers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-white border border-hairline rounded-2xl p-5 shadow-sm lg:col-span-2">
      <h3 className="font-black text-base mb-1">Bậc lương (7 bậc động theo doanh số dịch vụ)</h3>
      <p className="text-xs text-ink-muted mb-3">
        Nhân viên được xếp bậc cao nhất mà doanh số dịch vụ tháng đạt được. Cần đủ{" "}
        <b>{MIN_SHIFTS_FOR_OT} ca</b> để mở khoá KPI + lương OT.
      </p>
      {isLoading ? <SkeletonRows /> : (
        <div className="overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {["Bậc", "Tên", "DS dịch vụ tối thiểu", "Lương CB", "KPI", "Phụ cấp", "OT/giờ", ""].map((h) => (
                  <th key={h} className="text-left px-2 py-2 font-bold uppercase text-ink-muted border-b border-hairline">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <TierRow key={r.id} row={r} disabled={!canConfigure} onSave={(v) => saveM.mutate(v)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TierRow({ row, disabled, onSave }: { row: PayrollTier; disabled: boolean; onSave: (r: PayrollTier) => void }) {
  const [name, setName] = useState(row.tier_name);
  const [min, setMin] = useState(String(row.min_service_revenue));
  const [base, setBase] = useState(String(row.base_salary));
  const [kpi, setKpi] = useState(String(row.kpi_amount));
  const [allw, setAllw] = useState(String(row.allowance));
  const [ot, setOt] = useState(String(row.ot_hourly_rate));
  const dirty =
    name !== row.tier_name ||
    Number(min) !== Number(row.min_service_revenue) ||
    Number(base) !== Number(row.base_salary) ||
    Number(kpi) !== Number(row.kpi_amount) ||
    Number(allw) !== Number(row.allowance) ||
    Number(ot) !== Number(row.ot_hourly_rate);
  return (
    <tr>
      <td className="px-2 py-2 border-b border-hairline font-black text-brand-dark">{row.tier_level}</td>
      <td className="px-2 py-2 border-b border-hairline"><Input value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="w-24 h-8" /></td>
      <td className="px-2 py-2 border-b border-hairline"><Input type="number" value={min} onChange={(e) => setMin(e.target.value)} disabled={disabled} className="w-36 h-8" /></td>
      <td className="px-2 py-2 border-b border-hairline"><Input type="number" value={base} onChange={(e) => setBase(e.target.value)} disabled={disabled} className="w-32 h-8" /></td>
      <td className="px-2 py-2 border-b border-hairline"><Input type="number" value={kpi} onChange={(e) => setKpi(e.target.value)} disabled={disabled} className="w-28 h-8" /></td>
      <td className="px-2 py-2 border-b border-hairline"><Input type="number" value={allw} onChange={(e) => setAllw(e.target.value)} disabled={disabled} className="w-28 h-8" /></td>
      <td className="px-2 py-2 border-b border-hairline"><Input type="number" value={ot} onChange={(e) => setOt(e.target.value)} disabled={disabled} className="w-24 h-8" /></td>
      <td className="px-2 py-2 border-b border-hairline">
        <Button size="sm" disabled={disabled || !dirty} onClick={() => onSave({
          ...row, tier_name: name,
          min_service_revenue: Number(min), base_salary: Number(base),
          kpi_amount: Number(kpi), allowance: Number(allw), ot_hourly_rate: Number(ot),
        })}>
          <Save size={12} />
        </Button>
      </td>
    </tr>
  );
}

/* ---- Extras: sales-tier %, hot, upsale ---- */
function PayrollExtrasSection({ canConfigure }: { canConfigure: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("payroll_settings").select("*").eq("id", 1).maybeSingle();
      if (!data) return DEFAULT_PAYROLL_SETTINGS;
      const d = data as Record<string, unknown>;
      return {
        sales_commission_tiers: (d.sales_commission_tiers as SalesCommissionTier[]) ?? DEFAULT_PAYROLL_SETTINGS.sales_commission_tiers,
        hot_bonus_percent: Number(d.hot_bonus_percent ?? 0),
        hot_bonus_threshold: Number(d.hot_bonus_threshold ?? 0),
        upsale_bonus_percent: Number(d.upsale_bonus_percent ?? 0),
      } as PayrollSettings;
    },
  });

  const [tiers, setTiers] = useState<SalesCommissionTier[] | null>(null);
  const [hotPct, setHotPct] = useState<string>("");
  const [hotThr, setHotThr] = useState<string>("");
  const [upsPct, setUpsPct] = useState<string>("");

  const eff = data ?? DEFAULT_PAYROLL_SETTINGS;
  const currentTiers = tiers ?? eff.sales_commission_tiers;
  const currentHotPct = hotPct === "" ? String(eff.hot_bonus_percent) : hotPct;
  const currentHotThr = hotThr === "" ? String(eff.hot_bonus_threshold) : hotThr;
  const currentUpsPct = upsPct === "" ? String(eff.upsale_bonus_percent) : upsPct;

  const saveM = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("payroll_settings").upsert({
        id: 1,
        sales_commission_tiers: currentTiers,
        hot_bonus_percent: Number(currentHotPct),
        hot_bonus_threshold: Number(currentHotThr),
        upsale_bonus_percent: Number(currentUpsPct),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã lưu cấu hình");
      setTiers(null); setHotPct(""); setHotThr(""); setUpsPct("");
      qc.invalidateQueries({ queryKey: ["payroll-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-white border border-hairline rounded-2xl p-5 shadow-sm lg:col-span-2">
      <h3 className="font-black text-base mb-1">Hoa hồng bán hàng & thưởng nóng</h3>
      <p className="text-xs text-ink-muted mb-3">
        Bậc % hoa hồng theo doanh số sản phẩm, mốc thưởng nóng và % thưởng upsale.
      </p>

      {isLoading ? <SkeletonRows /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase text-ink-muted mb-2">Bậc hoa hồng bán hàng</div>
            <div className="space-y-2">
              {currentTiers.map((t, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs w-8 text-ink-muted">≥</span>
                  <Input type="number" value={String(t.min)} disabled={!canConfigure}
                    onChange={(e) => {
                      const next = [...currentTiers];
                      next[i] = { ...t, min: Number(e.target.value) };
                      setTiers(next);
                    }} className="h-8" />
                  <Input type="number" step="0.1" value={String(t.percent)} disabled={!canConfigure}
                    onChange={(e) => {
                      const next = [...currentTiers];
                      next[i] = { ...t, percent: Number(e.target.value) };
                      setTiers(next);
                    }} className="h-8 w-24" />
                  <span className="text-xs">%</span>
                  {canConfigure && (
                    <button className="text-destructive" onClick={() => setTiers(currentTiers.filter((_, j) => j !== i))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {canConfigure && (
                <Button size="sm" variant="outline" onClick={() => setTiers([...(currentTiers), { min: 0, percent: 0 }])}>
                  <Plus size={12} /> Thêm bậc
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Thưởng nóng: khi DS sản phẩm ≥ (VND)</Label>
              <Input type="number" value={currentHotThr} disabled={!canConfigure}
                onChange={(e) => setHotThr(e.target.value)} className="mt-1 h-8" />
            </div>
            <div>
              <Label className="text-xs">% thưởng nóng trên DS sản phẩm</Label>
              <Input type="number" step="0.1" value={currentHotPct} disabled={!canConfigure}
                onChange={(e) => setHotPct(e.target.value)} className="mt-1 h-8" />
            </div>
            <div>
              <Label className="text-xs">% thưởng upsale</Label>
              <Input type="number" step="0.1" value={currentUpsPct} disabled={!canConfigure}
                onChange={(e) => setUpsPct(e.target.value)} className="mt-1 h-8" />
            </div>
          </div>
        </div>
      )}

      {canConfigure && (
        <div className="mt-4">
          <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}>
            <Save size={14} /> Lưu cấu hình
          </Button>
        </div>
      )}
    </section>
  );
}


/* ---- Salary ---- */
function SalarySection({ canConfigure }: { canConfigure: boolean }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["salary-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_configs").select("*").order("role");
      if (error) throw error;
      return (data ?? []) as SalaryConfig[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: SalaryConfig) => {
      const { error } = await supabase
        .from("salary_configs")
        .update({
          base_salary_per_shift: row.base_salary_per_shift,
          ot_hourly_rate: row.ot_hourly_rate,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã lưu cấu hình lương");
      qc.invalidateQueries({ queryKey: ["salary-configs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-white border border-hairline rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-black text-base">Cấu hình lương theo vai trò</h3>
          <p className="text-xs text-ink-muted">1 ngày công = 2 ca. Lương OT tính theo giờ.</p>
        </div>
      </div>
      {isLoading ? <SkeletonRows /> : (
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["Vai trò", "Lương / ca (VND)", "OT / giờ (VND)", ""].map((h) => (
                  <th key={h} className="text-left px-2 py-2 text-[11px] font-bold uppercase text-ink-muted border-b border-hairline">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <SalaryRow key={r.id} row={r} disabled={!canConfigure} onSave={(v) => save.mutate(v)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!canConfigure && (
        <p className="mt-3 text-xs text-ink-muted flex items-center gap-1"><Lock size={12} /> Chỉ Admin chỉnh sửa được.</p>
      )}
    </section>
  );
}

function SalaryRow({
  row, disabled, onSave,
}: {
  row: SalaryConfig; disabled: boolean; onSave: (r: SalaryConfig) => void;
}) {
  const [base, setBase] = useState(String(row.base_salary_per_shift));
  const [ot, setOt] = useState(String(row.ot_hourly_rate));
  const dirty =
    Number(base) !== Number(row.base_salary_per_shift) ||
    Number(ot) !== Number(row.ot_hourly_rate);
  return (
    <tr>
      <td className="px-2 py-2 border-b border-hairline font-semibold">
        {ROLE_LABEL[row.role] ?? row.role}
      </td>
      <td className="px-2 py-2 border-b border-hairline">
        <Input type="number" value={base} onChange={(e) => setBase(e.target.value)} disabled={disabled} className="w-40" />
      </td>
      <td className="px-2 py-2 border-b border-hairline">
        <Input type="number" value={ot} onChange={(e) => setOt(e.target.value)} disabled={disabled} className="w-32" />
      </td>
      <td className="px-2 py-2 border-b border-hairline">
        <Button
          size="sm"
          disabled={disabled || !dirty}
          onClick={() => onSave({ ...row, base_salary_per_shift: Number(base), ot_hourly_rate: Number(ot) })}
        >
          <Save size={14} /> Lưu
        </Button>
      </td>
    </tr>
  );
}

/* ---- Bonus Tiers ---- */
function BonusTiersSection({ canConfigure }: { canConfigure: boolean }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["bonus-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bonus_tiers").select("*").order("target_amount");
      if (error) throw error;
      return (data ?? []) as BonusTier[];
    },
  });

  const [form, setForm] = useState({
    tier_name: "", target_amount: "", bonus_amount: "", bonus_type: "total" as "total" | "product" | "service",
  });

  const addM = useMutation({
    mutationFn: async () => {
      if (!form.tier_name) throw new Error("Nhập tên mốc");
      const { error } = await supabase.from("bonus_tiers").insert({
        tier_name: form.tier_name,
        target_amount: Number(form.target_amount),
        bonus_amount: Number(form.bonus_amount),
        bonus_type: form.bonus_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã thêm mốc thưởng");
      setForm({ tier_name: "", target_amount: "", bonus_amount: "", bonus_type: "total" });
      qc.invalidateQueries({ queryKey: ["bonus-tiers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bonus_tiers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["bonus-tiers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-white border border-hairline rounded-2xl p-5 shadow-sm">
      <h3 className="font-black text-base mb-1">Mốc thưởng doanh số</h3>
      <p className="text-xs text-ink-muted mb-3">Khi doanh số bán trong tháng đạt mốc → tự động cộng thưởng.</p>

      {canConfigure && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3 p-3 bg-brand-soft/40 rounded-xl">
          <Input placeholder="Tên mốc" value={form.tier_name}
            onChange={(e) => setForm((p) => ({ ...p, tier_name: e.target.value }))} />
          <Input type="number" placeholder="Doanh số (VND)" value={form.target_amount}
            onChange={(e) => setForm((p) => ({ ...p, target_amount: e.target.value }))} />
          <Input type="number" placeholder="Tiền thưởng (VND)" value={form.bonus_amount}
            onChange={(e) => setForm((p) => ({ ...p, bonus_amount: e.target.value }))} />
          <Select value={form.bonus_type} onValueChange={(v) => setForm((p) => ({ ...p, bonus_type: v as "total" | "product" | "service" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Tổng</SelectItem>
              <SelectItem value="product">Sản phẩm</SelectItem>
              <SelectItem value="service">Dịch vụ</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => addM.mutate()} disabled={addM.isPending}>
            <Plus size={14} /> Thêm
          </Button>
        </div>
      )}

      {isLoading ? <SkeletonRows /> : (
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["Tên mốc", "Doanh số cần đạt", "Thưởng", "Loại", ""].map((h) => (
                  <th key={h} className="text-left px-2 py-2 text-[11px] font-bold uppercase text-ink-muted border-b border-hairline">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={5} className="px-2 py-4 text-center text-ink-muted">Chưa có mốc</td></tr>
              ) : data.map((t) => (
                <tr key={t.id}>
                  <td className="px-2 py-2 border-b border-hairline font-semibold">{t.tier_name}</td>
                  <td className="px-2 py-2 border-b border-hairline">{formatVND(Number(t.target_amount))}</td>
                  <td className="px-2 py-2 border-b border-hairline text-amber-700 font-bold">{formatVND(Number(t.bonus_amount))}</td>
                  <td className="px-2 py-2 border-b border-hairline capitalize text-xs">{t.bonus_type}</td>
                  <td className="px-2 py-2 border-b border-hairline">
                    <button
                      className="text-destructive disabled:opacity-30"
                      disabled={!canConfigure || delM.isPending}
                      onClick={() => { if (confirm(`Xoá mốc "${t.tier_name}"?`)) delM.mutate(t.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---- Affiliate ---- */
function AffiliateSection({ canConfigure }: { canConfigure: boolean }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["affiliate-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliate_configs").select("*").order("ref_code");
      if (error) throw error;
      return (data ?? []) as AffiliateConfig[];
    },
  });
  const [form, setForm] = useState({ ref_code: "", commission_percent: "", note: "" });

  const addM = useMutation({
    mutationFn: async () => {
      if (!form.ref_code) throw new Error("Nhập mã CTV");
      const { error } = await supabase.from("affiliate_configs").insert({
        ref_code: form.ref_code.trim().toUpperCase(),
        commission_percent: Number(form.commission_percent),
        note: form.note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã thêm CTV");
      setForm({ ref_code: "", commission_percent: "", note: "" });
      qc.invalidateQueries({ queryKey: ["affiliate-configs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("affiliate_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["affiliate-configs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-white border border-hairline rounded-2xl p-5 shadow-sm lg:col-span-2">
      <h3 className="font-black text-base mb-1">Cấu hình hoa hồng CTV (Affiliate)</h3>
      <p className="text-xs text-ink-muted mb-3">% hoa hồng theo mã giới thiệu.</p>

      {canConfigure && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3 p-3 bg-brand-soft/40 rounded-xl">
          <Input placeholder="Mã CTV (VD: NGUYENA)" value={form.ref_code}
            onChange={(e) => setForm((p) => ({ ...p, ref_code: e.target.value }))} />
          <Input type="number" step="0.1" placeholder="% hoa hồng" value={form.commission_percent}
            onChange={(e) => setForm((p) => ({ ...p, commission_percent: e.target.value }))} />
          <Input placeholder="Ghi chú" value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
          <Button onClick={() => addM.mutate()} disabled={addM.isPending}>
            <Plus size={14} /> Thêm CTV
          </Button>
        </div>
      )}

      {isLoading ? <SkeletonRows /> : (
        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["Mã CTV", "% Hoa hồng", "Ghi chú", "Trạng thái", ""].map((h) => (
                  <th key={h} className="text-left px-2 py-2 text-[11px] font-bold uppercase text-ink-muted border-b border-hairline">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={5} className="px-2 py-4 text-center text-ink-muted">Chưa có CTV</td></tr>
              ) : data.map((a) => (
                <tr key={a.id}>
                  <td className="px-2 py-2 border-b border-hairline font-mono font-bold">{a.ref_code}</td>
                  <td className="px-2 py-2 border-b border-hairline">{Number(a.commission_percent)}%</td>
                  <td className="px-2 py-2 border-b border-hairline text-ink-muted">{a.note ?? "—"}</td>
                  <td className="px-2 py-2 border-b border-hairline text-xs">
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-bold ${a.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {a.active ? "Đang bật" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-2 py-2 border-b border-hairline">
                    <button
                      className="text-destructive disabled:opacity-30"
                      disabled={!canConfigure || delM.isPending}
                      onClick={() => { if (confirm(`Xoá CTV "${a.ref_code}"?`)) delM.mutate(a.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---- Shared UI ---- */
function Kpi({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "brand" }) {
  const cls = tone === "brand"
    ? "from-[#eef7e6] to-white text-brand-dark border-[#d6e5c9]"
    : "from-slate-50 to-white border-slate-200";
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${cls} p-4 shadow-sm`}>
      <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-xl font-black mt-1">{value}</div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

// Silence unused import warning (Loader2 kept for future async states)
void Loader2;
