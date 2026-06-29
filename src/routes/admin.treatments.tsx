import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/admin/treatments")({
  component: TreatmentsAdmin,
});

type Treatment = {
  id: string; customer_id: string | null; package_name: string | null;
  total_sessions: number | null; used_sessions: number | null; remaining_sessions: number | null;
  status: string | null; created_at: string | null;
};
type Customer = { id: string; name: string | null };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function TreatmentsAdmin() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "treatments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["admin", "customers", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const nameOf = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    if (statusFilter === "active") return rows.filter((r) => (r.remaining_sessions ?? 0) > 0 && (r.status ?? "active") !== "cancelled");
    if (statusFilter === "done") return rows.filter((r) => (r.remaining_sessions ?? 0) <= 0);
    return rows.filter((r) => (r.status ?? "") === statusFilter);
  }, [rows, statusFilter]);

  return (
    <>
      <AdminTopbar
        title="Liệu trình khách hàng"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${rows.length} liệu trình`}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {(error as Error).message}
        </div>
      )}

      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang active (còn buổi)</SelectItem>
              <SelectItem value="done">Đã hết buổi</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr>
              {["Khách hàng", "Tên gói", "Tiến độ", "Trạng thái", "Ngày tạo"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading ? (
              <tr><td colSpan={5} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có liệu trình.</td></tr>
            ) : filtered.map((r) => {
              const used = r.used_sessions ?? 0;
              const total = r.total_sessions ?? 0;
              const remaining = r.remaining_sessions ?? Math.max(total - used, 0);
              const pct = total > 0 ? Math.round((used / total) * 100) : 0;
              return (
                <tr key={r.id}>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{nameOf(r.customer_id)}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.package_name ?? "—"}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] min-w-[240px]">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>Đã dùng <b>{used}</b> / <b>{total}</b></span>
                      <span className="text-brand-dark font-bold">Còn {remaining}</span>
                    </div>
                    <Progress value={pct} />
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[r.status ?? ""] ?? "bg-slate-100 text-slate-700"}`}>
                      {r.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "—"}
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
