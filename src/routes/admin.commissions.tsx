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

type Commission = {
  id: string; staff_id: string | null; commission_type: string | null;
  amount: number | null; status: string | null; created_at: string | null;
};
type User = { id: string; full_name: string | null };

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const now = new Date();
const YEARS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
const MONTHS = ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function CommissionsAdmin() {
  const qc = useQueryClient();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Commission[];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name");
      if (error) throw error;
      return (data ?? []) as User[];
    },
  });

  const nameOf = (id: string | null) => users.find((u) => u.id === id)?.full_name ?? "—";

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      if (String(d.getFullYear()) !== year) return false;
      if (month !== "all" && String(d.getMonth() + 1) !== month) return false;
      return true;
    });
  }, [rows, year, month]);

  const pendingByStaff = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      if ((r.status ?? "").toLowerCase() === "pending" && r.staff_id) {
        map.set(r.staff_id, (map.get(r.staff_id) ?? 0) + Number(r.amount ?? 0));
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commissions").update({ status: "paid" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã đánh dấu thanh toán");
      qc.invalidateQueries({ queryKey: ["admin", "commissions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCSV = () => {
    const csv = toCSV(
      filtered.map((r) => ({
        nhanvien: nameOf(r.staff_id),
        nguon: r.commission_type ?? "",
        amount: r.amount ?? 0,
        ngay: r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "",
        status: r.status ?? "",
      })),
      [
        { key: "nhanvien", label: "Nhân viên" },
        { key: "nguon", label: "Nguồn" },
        { key: "amount", label: "Số tiền (VND)" },
        { key: "ngay", label: "Ngày tạo" },
        { key: "status", label: "Trạng thái" },
      ],
    );
    downloadCSV(`hoa-hong-${year}-${month}.csv`, csv);
    toast.success("Đã xuất bảng lương");
  };

  return (
    <>
      <AdminTopbar
        title="Hoa hồng / Trả thưởng"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length} bản ghi · ${year}/${month === "all" ? "Cả năm" : month}`}
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
        {pendingByStaff.length === 0 ? (
          <div className="text-sm text-ink-muted bg-white border border-hairline rounded-xl p-4 font-semibold">Không có khoản hoa hồng nào đang chờ.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {pendingByStaff.map(([id, total]) => (
              <div key={id} className="bg-brand-lime border border-[#d6e5c9] rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#34483a]">{nameOf(id)}</div>
                <div className="text-base font-black text-brand-dark">{formatVND(total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              {["Nhân viên", "Nguồn", "Số tiền", "Ngày tạo", "Trạng thái", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có dữ liệu trong kỳ này.</td></tr>
            ) : filtered.map((r) => {
              const isPending = (r.status ?? "").toLowerCase() === "pending";
              return (
                <tr key={r.id}>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{nameOf(r.staff_id)}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.commission_type ?? "—"}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">{formatVND(Number(r.amount ?? 0))}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${isPending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{r.status ?? "—"}</span>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {isPending && (
                      <Button size="sm" onClick={() => markPaid.mutate(r.id)} disabled={markPaid.isPending}>Đã thanh toán</Button>
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
