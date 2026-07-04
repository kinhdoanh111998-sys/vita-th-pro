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

type TRow = {
  id: string;
  order_id: string;
  customer_id: string;
  service_id: string; // Đã thêm vào API fetch
  session_number: number;
  status: string;
  created_at: string;
};
type Service = { id: string; name: string; default_sessions: number | null };
type Customer = { id: string; name: string | null; phone: string | null };

type Aggregate = {
  id_group: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  service_name: string;
  total: number;
  completed: number;
  remaining: number;
  created_at: string;
  status: "active" | "done";
};

function TreatmentsAdmin() {
  const [statusFilter, setStatusFilter] = useState("all");

  const treatmentsQ = useQuery({
    queryKey: ["admin", "treatments", "all"],
    queryFn: async () => {
      // Đã sửa lại query gọi trực tiếp service_id từ bảng treatments
      const { data, error } = await supabase.from("treatments").select("id,order_id,customer_id,service_id,session_number,status,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TRow[];
    },
  });
  const servicesQ = useQuery({
    queryKey: ["admin", "services", "min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name,default_sessions");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
  const customersQ = useQuery({
    queryKey: ["admin", "customers", "min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name,phone");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const isLoading = treatmentsQ.isLoading || servicesQ.isLoading || customersQ.isLoading;
  const error = treatmentsQ.error || servicesQ.error || customersQ.error;

  const aggregates: Aggregate[] = useMemo(() => {
    const services = new Map((servicesQ.data ?? []).map((s) => [s.id, s]));
    const customers = new Map((customersQ.data ?? []).map((c) => [c.id, c]));
    const grouped = new Map<string, Aggregate>();
    
    for (const t of treatmentsQ.data ?? []) {
      // Logic gom nhóm mới: Nếu 1 đơn mua 2 dịch vụ khác nhau thì sẽ tách làm 2 dòng riêng biệt
      const key = `${t.order_id}_${t.service_id}`;
      let agg = grouped.get(key);
      if (!agg) {
        const svc = services.get(t.service_id);
        const cus = customers.get(t.customer_id);
        agg = {
          id_group: key,
          order_id: t.order_id,
          customer_id: t.customer_id,
          customer_name: cus?.name ?? "—",
          customer_phone: cus?.phone ?? null,
          service_name: svc?.name ?? "—",
          total: 0,
          completed: 0,
          remaining: 0,
          created_at: t.created_at,
          status: "active",
        };
        grouped.set(key, agg);
      }
      agg.total += 1;
      if (t.status === "completed") agg.completed += 1;
    }
    return Array.from(grouped.values()).map((a) => {
      a.remaining = Math.max(a.total - a.completed, 0);
      a.status = a.remaining <= 0 ? "done" : "active";
      return a;
    }).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [treatmentsQ.data, servicesQ.data, customersQ.data]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return aggregates;
    return aggregates.filter((a) => a.status === statusFilter);
  }, [aggregates, statusFilter]);

  return (
    <>
      <AdminTopbar
        title="Liệu trình khách hàng"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${aggregates.length} liệu trình`}
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
              <SelectItem value="done">Đã hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr>
              {["Khách hàng", "Dịch vụ", "Tiến độ", "Trạng thái", "Ngày tạo"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading ? (
              <tr><td colSpan={5} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có liệu trình.</td></tr>
            ) : filtered.map((r) => {
              const pct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
              return (
                <tr key={r.id_group}>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <div className="font-semibold">{r.customer_name}</div>
                    <div className="text-xs text-ink-muted">{r.customer_phone}</div>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-medium text-brand-dark">{r.service_name}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] min-w-[260px]">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>Đã dùng <b>{r.completed}</b> / <b>{r.total}</b></span>
                      <span className="text-brand-dark font-bold">Còn {r.remaining}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "done" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {r.status === "done" ? "Hoàn thành" : "Đang thực hiện"}
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
