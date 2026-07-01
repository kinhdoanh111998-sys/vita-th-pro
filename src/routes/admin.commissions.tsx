import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Wallet, CheckCheck, Lock } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { downloadCSV, toCSV } from "@/lib/csv";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/admin/commissions")({
  component: CommissionsAdmin,
});

type Commission = {
  id: string;
  staff_id: string | null;
  commission_type: string | null;
  reference_id: string | null;
  amount: number | null;
  status: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string | null;
};

type Staff = { id: string; full_name: string | null; role: string };

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
const MONTHS = ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function CommissionsAdmin() {
  const qc = useQueryClient();
  const { role } = useAuth();
  const canPay = role === "admin";
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [payingStaff, setPayingStaff] = useState<string | null>(null);

  const staffQ = useQuery({
    queryKey: ["commissions-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,full_name,role")
        .in("role", ["admin", "staff", "manager"])
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Staff[];
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id,staff_id,commission_type,reference_id,amount,status,paid_at,note,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Commission[];
    },
  });

  const staffMap = useMemo(
    () => new Map((staffQ.data ?? []).map((s) => [s.id, s])),
    [staffQ.data],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      if (String(d.getFullYear()) !== year) return false;
      if (month !== "all" && String(d.getMonth() + 1) !== month) return false;
      if (staffFilter !== "all" && r.staff_id !== staffFilter) return false;
      if (typeFilter !== "all" && r.commission_type !== typeFilter) return false;
      return true;
    });
  }, [rows, year, month, staffFilter, typeFilter]);

  type Agg = {
    staffId: string;
    name: string;
    pending: number;
    paid: number;
    count: number;
    lastPaidAt: string | null;
  };
  const grouped = useMemo<Agg[]>(() => {
    const map = new Map<string, Agg>();
    filtered.forEach((r) => {
      if (!r.staff_id) return;
      const name = staffMap.get(r.staff_id)?.full_name ?? "(nhân viên)";
      const amt = Number(r.amount ?? 0);
      const entry =
        map.get(r.staff_id) ?? {
          staffId: r.staff_id,
          name,
          pending: 0,
          paid: 0,
          count: 0,
          lastPaidAt: null,
        };
      if (r.status === "paid") {
        entry.paid += amt;
        if (r.paid_at && (!entry.lastPaidAt || r.paid_at > entry.lastPaidAt)) {
          entry.lastPaidAt = r.paid_at;
        }
      } else {
        entry.pending += amt;
      }
      entry.count += 1;
      map.set(r.staff_id, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
  }, [filtered, staffMap]);

  const totals = useMemo(() => {
    const t = { pending: 0, paid: 0, count: filtered.length };
    grouped.forEach((g) => {
      t.pending += g.pending;
      t.paid += g.paid;
    });
    return t;
  }, [grouped, filtered]);

  const pendingList = useMemo(() => grouped.filter((g) => g.pending > 0), [grouped]);

  const markPaidForStaff = useMutation({
    mutationFn: async (staffId: string) => {
      // Chỉ đánh dấu paid cho các bản ghi thuộc kỳ đang lọc
      const targets = filtered.filter(
        (r) => r.staff_id === staffId && r.status !== "paid",
      );
      if (targets.length === 0) return { staffId, count: 0 };
      const ids = targets.map((r) => r.id);
      const { error } = await supabase
        .from("commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
      return { staffId, count: targets.length };
    },
    onMutate: (staffId) => setPayingStaff(staffId),
    onSuccess: (res) => {
      toast.success(`Đã thanh toán ${res.count} khoản hoa hồng`);
      qc.invalidateQueries({ queryKey: ["admin", "commissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setPayingStaff(null),
  });

  const markPaidAll = useMutation({
    mutationFn: async () => {
      const targets = filtered.filter((r) => r.status !== "paid");
      if (targets.length === 0) return 0;
      const { error } = await supabase
        .from("commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .in("id", targets.map((r) => r.id));
      if (error) throw error;
      return targets.length;
    },
    onSuccess: (n) => {
      if (n === 0) toast.info("Không có khoản chờ thanh toán trong kỳ.");
      else toast.success(`Đã thanh toán toàn bộ ${n} khoản trong kỳ`);
      qc.invalidateQueries({ queryKey: ["admin", "commissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCSV = () => {
    const csv = toCSV(
      grouped.map((g) => ({
        nhanvien: g.name,
        so_khoan: g.count,
        chua_tt: g.pending,
        da_tt: g.paid,
        tong: g.pending + g.paid,
      })),
      [
        { key: "nhanvien", label: "Nhân viên" },
        { key: "so_khoan", label: "Số khoản" },
        { key: "chua_tt", label: "Chưa thanh toán (VND)" },
        { key: "da_tt", label: "Đã thanh toán (VND)" },
        { key: "tong", label: "Tổng (VND)" },
      ],
    );
    downloadCSV(`hoa-hong-${year}-${month}.csv`, csv);
    toast.success("Đã xuất bảng lương");
  };

  const kyLabel = month === "all" ? year : `${month}/${year}`;

  return (
    <>
      <AdminTopbar
        title="Hoa hồng / Trả thưởng"
        subtitle={
          isLoading
            ? "Đang tải..."
            : `${grouped.length} nhân viên · ${totals.count} khoản · Kỳ ${kyLabel}`
        }
        right={
          <div className="flex gap-2">
            <Button onClick={exportCSV}>
              <Download size={16} /> Xuất CSV
            </Button>
            <Button
              onClick={() => markPaidAll.mutate()}
              disabled={!canPay || markPaidAll.isPending || totals.pending === 0}
              title={canPay ? "" : "Chỉ Admin được thanh toán"}
            >
              {canPay ? <CheckCheck size={16} /> : <Lock size={16} />}
              {markPaidAll.isPending ? "Đang xử lý…" : "Trả tất cả trong kỳ"}
            </Button>
          </div>
        }
      />


      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <KpiCard label="Chưa thanh toán" value={formatVND(totals.pending)} tone="warn" />
        <KpiCard label="Đã thanh toán" value={formatVND(totals.paid)} tone="ok" />
        <KpiCard label="Tổng hoa hồng kỳ" value={formatVND(totals.pending + totals.paid)} tone="brand" />
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Tháng</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m === "all" ? "Cả năm" : `Tháng ${m}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Năm</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Loại hoa hồng</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="service">Dịch vụ (buổi)</SelectItem>
              <SelectItem value="sale">Bán sản phẩm</SelectItem>
              <SelectItem value="referral">Giới thiệu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nhân viên</Label>
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              {(staffQ.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name ?? "(chưa đặt tên)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pending highlight chips */}
      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
          Tổng chưa thanh toán theo nhân viên
        </div>
        {pendingList.length === 0 ? (
          <div className="text-sm text-ink-muted bg-white border border-hairline rounded-xl p-4 font-semibold">
            Không có khoản hoa hồng nào đang chờ.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {pendingList.map((g) => (
              <div
                key={g.staffId}
                className="bg-brand-lime border border-[#d6e5c9] rounded-2xl px-4 py-2.5 shadow-sm"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#34483a]">{g.name}</div>
                <div className="text-base font-black text-brand-dark">{formatVND(g.pending)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aggregate table */}
      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              {["Nhân viên", "Số khoản", "Chưa thanh toán", "Đã thanh toán", "Tổng", "Trả gần nhất", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3.5 py-10 text-center text-ink-muted font-semibold">
                  Không có dữ liệu trong kỳ này.
                </td>
              </tr>
            ) : (
              grouped.map((g) => {
                const isPaying = payingStaff === g.staffId && markPaidForStaff.isPending;
                return (
                  <tr key={g.staffId}>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{g.name}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{g.count}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-amber-700">{formatVND(g.pending)}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-emerald-700">{formatVND(g.paid)}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">{formatVND(g.pending + g.paid)}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] text-ink-muted">
                      {g.lastPaidAt ? new Date(g.lastPaidAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      {g.pending > 0 ? (
                        <Button
                          size="sm"
                          onClick={() => markPaidForStaff.mutate(g.staffId)}
                          disabled={!canPay || isPaying || markPaidForStaff.isPending}
                          title={canPay ? "" : "Chỉ Admin được thanh toán"}
                        >
                          {canPay ? <Wallet size={14} /> : <Lock size={14} />}
                          {isPaying ? "Đang xử lý..." : "Thanh toán"}
                        </Button>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Đã trả đủ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail transactions */}
      <div className="mt-6">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
          Chi tiết giao dịch trong kỳ ({filtered.length})
        </div>
        <div className="overflow-auto bg-white border border-hairline rounded-2xl">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                {["Thời gian", "Nhân viên", "Loại", "Số tiền", "Trạng thái", "Ngày trả"].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-[#f7faf5] text-[#34483a] border-b border-[#edf3ed]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3.5 py-6 text-center text-ink-muted">Không có giao dịch.</td>
                </tr>
              ) : (
                filtered.slice(0, 200).map((r) => (
                  <tr key={r.id}>
                    <td className="px-3.5 py-2 text-sm border-b border-[#edf3ed]">
                      {r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-3.5 py-2 text-sm border-b border-[#edf3ed] font-semibold">
                      {r.staff_id ? staffMap.get(r.staff_id)?.full_name ?? "—" : "—"}
                    </td>
                    <td className="px-3.5 py-2 text-sm border-b border-[#edf3ed] capitalize">
                      {r.commission_type ?? "—"}
                    </td>
                    <td className="px-3.5 py-2 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">
                      {formatVND(Number(r.amount ?? 0))}
                    </td>
                    <td className="px-3.5 py-2 text-sm border-b border-[#edf3ed]">
                      {r.status === "paid" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          Chờ
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-sm border-b border-[#edf3ed] text-ink-muted">
                      {r.paid_at ? new Date(r.paid_at).toLocaleDateString("vi-VN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "warn" | "ok" | "brand";
}) {
  const toneClass =
    tone === "warn"
      ? "from-amber-50 to-white text-amber-800 border-amber-200"
      : tone === "ok"
      ? "from-emerald-50 to-white text-emerald-800 border-emerald-200"
      : "from-[#eef7e6] to-white text-brand-dark border-[#d6e5c9]";
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneClass} p-4 shadow-sm`}>
      <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  );
}
