import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsAdmin,
});

type Booking = {
  id: string; customer_name: string | null; phone: string | null;
  service: string | null; booking_date: string | null; booking_time: string | null;
  note: string | null; status: string | null; created_at: string | null;
};

const STATUS_OPTIONS = ["Chờ xác nhận", "Đã xác nhận", "Hoàn thành", "Đã hủy"];
const STATUS_STYLES: Record<string, string> = {
  "Chờ xác nhận": "bg-amber-100 text-amber-800 border-amber-200",
  "Đã xác nhận": "bg-blue-100 text-blue-800 border-blue-200",
  "Hoàn thành": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Đã hủy": "bg-rose-100 text-rose-800 border-rose-200",
};

function BookingsAdmin() {
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = r.booking_date ?? "";
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [rows, from, to]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AdminTopbar title="Lịch hẹn" subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${rows.length} lịch hẹn`} />

      {error && <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">{(error as Error).message}</div>}

      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5"><Label className="text-xs">Từ ngày</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[170px]" />
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Đến ngày</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[170px]" />
        </div>
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>Xoá lọc</Button>
        )}
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[960px] border-collapse">
          <thead>
            <tr>
              {["Khách hàng", "SĐT", "Dịch vụ", "Ngày", "Giờ", "Ghi chú", "Trạng thái", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading ? (
              <tr><td colSpan={8} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có lịch hẹn.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{r.customer_name ?? "-"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.phone ?? "-"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.service ?? "-"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.booking_date ?? "-"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.booking_time ?? "-"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] max-w-[200px] truncate">{r.note ?? ""}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[r.status ?? ""] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {r.status ?? "—"}
                  </span>
                </td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <Select value={r.status ?? undefined} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                    <SelectTrigger className="w-[170px] h-8"><SelectValue placeholder="Đổi trạng thái" /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
