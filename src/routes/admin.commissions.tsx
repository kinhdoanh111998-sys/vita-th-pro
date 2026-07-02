import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Save, Plus, Trash2, Loader2, Lock, Settings2, LineChart } from "lucide-react";
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

  const salaryQ = useQuery({
    queryKey: ["salary-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_configs").select("*");
      if (error) throw error;
      return (data ?? []) as SalaryConfig[];
    },
  });

  const bonusQ = useQuery({
    queryKey: ["bonus-tiers-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_tiers")
        .select("*")
        .eq("active", true)
        .order("target_amount", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BonusTier[];
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

  const ordersQ = useQuery({
    queryKey: ["payroll-orders", startISO, endISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,sales_staff_id,total_amount,created_at")
        .gte("created_at", startISO)
        .lt("created_at", endISO)
        .eq("status", "paid");
      if (error) throw error;
      return (data ?? []) as OrderRow[];
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

  const salaryByRole = useMemo(() => {
    const m = new Map<string, SalaryConfig>();
    (salaryQ.data ?? []).forEach((s) => m.set(s.role, s));
    return m;
  }, [salaryQ.data]);

  type Row = {
    staffId: string;
    name: string;
    role: string;
    shifts: number;
    otHours: number;
    shiftSalary: number;
    otSalary: number;
    saleAmount: number;
    saleCommission: number;
    serviceCommission: number;
    bonus: number;
    matchedTier: string | null;
    total: number;
  };

  const rows = useMemo<Row[]>(() => {
    const staffs = staffQ.data ?? [];
    const atts = attQ.data ?? [];
    const orders = ordersQ.data ?? [];
    const comms = commQ.data ?? [];
    const tiers = bonusQ.data ?? [];

    return staffs.map((s) => {
      const cfg = salaryByRole.get(s.role);
      const basePerShift = Number(cfg?.base_salary_per_shift ?? 0);
      const otRate = Number(cfg?.ot_hourly_rate ?? 0);

      const myAtts = atts.filter((a) => a.employee_id === s.id);
      const shifts = myAtts.filter((a) => a.check_in_approved).length;
      const otHours = myAtts
        .filter((a) => a.ot_approved)
        .reduce((sum, a) => sum + Number(a.ot_hours ?? 0), 0);

      // Doanh số bán trực tiếp qua orders
      const myOrders = orders.filter((o) => o.sales_staff_id === s.id);
      const saleAmount = myOrders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);

      // Hoa hồng đã ghi nhận trong bảng commissions
      const myComms = comms.filter((c) => c.staff_id === s.id);
      const saleCommission = myComms
        .filter((c) => c.commission_type === "sale" || c.commission_type === "product")
        .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
      const serviceCommission = myComms
        .filter(
          (c) =>
            c.commission_type === "tour_service" ||
            c.commission_type === "service",
        )
        .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

      // Bonus: xét mốc cao nhất mà saleAmount đạt được (type total)
      let bonus = 0;
      let matchedTier: string | null = null;
      tiers
        .filter((t) => t.bonus_type === "total" || t.bonus_type === "product")
        .forEach((t) => {
          if (saleAmount >= Number(t.target_amount) && Number(t.bonus_amount) > bonus) {
            bonus = Number(t.bonus_amount);
            matchedTier = t.tier_name;
          }
        });

      const shiftSalary = shifts * basePerShift;
      const otSalary = otHours * otRate;
      const total = shiftSalary + otSalary + saleCommission + serviceCommission + bonus;

      return {
        staffId: s.id,
        name: s.full_name ?? "(chưa đặt tên)",
        role: s.role,
        shifts,
        otHours,
        shiftSalary,
        otSalary,
        saleAmount,
        saleCommission,
        serviceCommission,
        bonus,
        matchedTier,
        total,
      };
    });
  }, [staffQ.data, attQ.data, ordersQ.data, commQ.data, bonusQ.data, salaryByRole]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.shiftSalary += r.shiftSalary;
        acc.otSalary += r.otSalary;
        acc.saleCommission += r.saleCommission;
        acc.serviceCommission += r.serviceCommission;
        acc.bonus += r.bonus;
        acc.total += r.total;
        return acc;
      },
      {
        shiftSalary: 0, otSalary: 0, saleCommission: 0,
        serviceCommission: 0, bonus: 0, total: 0,
      },
    );
  }, [rows]);

  const isLoading =
    staffQ.isLoading || attQ.isLoading || ordersQ.isLoading || commQ.isLoading;

  const exportCSV = () => {
    const csv = toCSV(
      rows.map((r) => ({
        nhanvien: r.name,
        role: ROLE_LABEL[r.role] ?? r.role,
        so_ca: r.shifts,
        gio_ot: r.otHours,
        luong_ca: r.shiftSalary,
        luong_ot: r.otSalary,
        doanh_so: r.saleAmount,
        hh_sale: r.saleCommission,
        hh_dv: r.serviceCommission,
        thuong: r.bonus,
        tong: r.total,
      })),
      [
        { key: "nhanvien", label: "Nhân viên" },
        { key: "role", label: "Vai trò" },
        { key: "so_ca", label: "Số ca duyệt" },
        { key: "gio_ot", label: "Giờ OT" },
        { key: "luong_ca", label: "Lương ca (VND)" },
        { key: "luong_ot", label: "Lương OT (VND)" },
        { key: "doanh_so", label: "Doanh số bán (VND)" },
        { key: "hh_sale", label: "HH bán hàng (VND)" },
        { key: "hh_dv", label: "HH dịch vụ (VND)" },
        { key: "thuong", label: "Thưởng doanh số (VND)" },
        { key: "tong", label: "TỔNG THU NHẬP (VND)" },
      ],
    );
    downloadCSV(`bang-luong-${month}-${year}.csv`, csv);
    toast.success("Đã xuất bảng lương");
  };

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
        <div className="ml-auto">
          <Button onClick={exportCSV} disabled={rows.length === 0}>
            <Download size={16} /> Xuất bảng lương
          </Button>
        </div>
      </div>

      <p className="text-xs text-ink-muted mb-3">
        Ghi chú: 1 ngày công chuẩn = 2 ca. Lương ca tính trên
        <b> số ca đã duyệt check-in</b>; Lương OT tính trên <b>giờ OT đã duyệt</b>;
        Thưởng doanh số tự động áp mốc cao nhất mà nhân viên đạt được.
      </p>

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-4 mb-4">
        <Kpi label="Lương ca" value={formatVND(totals.shiftSalary)} />
        <Kpi label="Lương OT" value={formatVND(totals.otSalary)} />
        <Kpi label="Hoa hồng (bán + DV)" value={formatVND(totals.saleCommission + totals.serviceCommission)} />
        <Kpi label="Tổng thu nhập kỳ" value={formatVND(totals.total)} tone="brand" />
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead>
            <tr>
              {[
                "Nhân viên", "Vai trò", "Số ca", "Giờ OT", "Lương ca", "Lương OT",
                "Doanh số bán", "HH bán", "HH dịch vụ", "Thưởng DS", "TỔNG",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={11} className="px-3 py-10 text-center text-ink-muted">Đang tính lương…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-10 text-center text-ink-muted">Không có nhân viên.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.staffId} className="hover:bg-brand-soft/30">
                <td className="px-3 py-2 border-b border-[#edf3ed] font-semibold">{r.name}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed] text-xs">
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                    {ROLE_LABEL[r.role] ?? r.role}
                  </span>
                </td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">{r.shifts}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">{r.otHours.toFixed(2)}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(r.shiftSalary)}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(r.otSalary)}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed] text-slate-600">{formatVND(r.saleAmount)}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(r.saleCommission)}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">{formatVND(r.serviceCommission)}</td>
                <td className="px-3 py-2 border-b border-[#edf3ed]">
                  {r.bonus > 0 ? (
                    <div>
                      <div className="font-bold text-amber-700">{formatVND(r.bonus)}</div>
                      {r.matchedTier && <div className="text-[10px] text-ink-muted">{r.matchedTier}</div>}
                    </div>
                  ) : "—"}
                </td>
                <td className="px-3 py-2 border-b border-[#edf3ed] font-black text-brand-dark">{formatVND(r.total)}</td>
              </tr>
            ))}
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
      <SalarySection canConfigure={canConfigure} />
      <BonusTiersSection canConfigure={canConfigure} />
      <AffiliateSection canConfigure={canConfigure} />
    </div>
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
