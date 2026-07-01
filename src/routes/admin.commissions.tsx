import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { downloadCSV, toCSV } from "@/lib/csv";

export const Route = createFileRoute("/admin/commissions")({
  component: CommissionsAdmin,
});

type Treatment = {
  id: string;
  technician_name: string | null;
  commission_amount: number | null;
  commission_status: string | null;
  created_at: string | null;
};

const PENDING = "Chưa thanh toán";
const PAID = "Đã thanh toán";

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
const MONTHS = ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function CommissionsAdmin() {
  const qc = useQueryClient();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [payingTech, setPayingTech] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "commissions-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id,technician_name,commission_amount,commission_status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      if (String(d.getFullYear()) !== year) return false;
      if (month !== "all" && String(d.getMonth() + 1) !== month) return false;
      return true;
    });
  }, [rows, year, month]);

  type Agg = { technician: string; pending: number; paid: number; count: number };
  const grouped = useMemo<Agg[]>(() => {
    const map = new Map<string, Agg>();
    filtered.forEach((r) => {
      const tech = (r.technician_name ?? "").trim();
      if (!tech) return;
      const amt = Number(r.commission_amount ?? 0);
      const entry = map.get(tech) ?? { technician: tech, pending: 0, paid: 0, count: 0 };
      if (r.commission_status === PAID) entry.paid += amt;
      else entry.pending += amt;
      entry.count += 1;
      map.set(tech, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
  }, [filtered]);

  const pendingList = useMemo(() => grouped.filter((g) => g.pending > 0), [grouped]);

  const markPaid = useMutation({
    mutationFn: async (technician: string) => {
      const { error } = await supabase
        .from("treatments")
        .update({ commission_status: PAID })
        .eq("technician_name", technician)
        .eq("commission_status", PENDING);
      if (error) throw error;
      return technician;
    },
    onMutate: (technician) => setPayingTech(technician),
    onSuccess: () => {
      toast.success("Đã thanh toán hoa hồng thành công");
      qc.invalidateQueries({ queryKey: ["admin", "commissions-treatments"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setPayingTech(null),
  });

  const exportCSV = () => {
    const csv = toCSV(
      grouped.map((g) => ({
        nhanvien: g.technician,
        so_buoi: g.count,
        chua_tt: g.pending,
        da_tt: g.paid,
        tong: g.pending + g.paid,
      })),
      [
        { key: "nhanvien", label: "Nhân viên" },
        { key: "so_buoi", label: "Số buổi" },
        { key: "chua_tt", label: "Chưa thanh toán (VND)" },
        { key: "da_tt", label: "Đã thanh toán (VND)" },
        { key: "tong", label: "Tổng (VND)" },
      ],
    );
    downloadCSV(`hoa-hong-${year}-${month}.csv`, csv);
    toast.success("Đã xuất bảng lương");
  };

  return (
    <>
      <AdminTopbar
        title="Hoa hồng / Trả thưởng"
        subtitle={isLoading ? "Đang tải..." : `${grouped.length} nhân viên · ${filtered.length} buổi · ${year}/${month === "all" ? "Cả năm" : month}`}
        right={<Button onClick={exportCSV}><Download size={16} /> Xuất Excel/CSV</Button>}
      />

      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5"><Label className="text-xs">Tháng</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m === "all" ? "Cả năm" : `Tháng ${m}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Năm</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Tổng chưa thanh toán theo nhân viên</div>
        {pendingList.length === 0 ? (
          <div className="text-sm text-ink-muted bg-white border border-hairline rounded-xl p-4 font-semibold">Không có khoản hoa hồng nào đang chờ.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {pendingList.map((g) => (
              <div key={g.technician} className="bg-brand-lime border border-[#d6e5c9] rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#34483a]">{g.technician}</div>
                <div className="text-base font-black text-brand-dark">{formatVND(g.pending)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              {["Nhân viên", "Số buổi", "Chưa thanh toán", "Đã thanh toán", "Tổng", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr><td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có dữ liệu trong kỳ này.</td></tr>
            ) : grouped.map((g) => {
              const isPaying = payingTech === g.technician && markPaid.isPending;
              return (
                <tr key={g.technician}>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{g.technician}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{g.count}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-amber-700">{formatVND(g.pending)}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-emerald-700">{formatVND(g.paid)}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">{formatVND(g.pending + g.paid)}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {g.pending > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => markPaid.mutate(g.technician)}
                        disabled={isPaying || markPaid.isPending}
                      >
                        {isPaying ? "Đang xử lý..." : "Thanh toán"}
                      </Button>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã trả đủ</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
