import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Eye, Phone, Mail, MapPin, User as UserIcon } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersAdmin,
});

type Customer = {
  id: string; name: string | null; phone: string | null;
  source: string | null; note: string | null; status: string | null;
  email?: string | null; address?: string | null;
};

const EMPTY = { name: "", phone: "", source: "", note: "", status: "Đang chăm sóc" };

const money = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function CustomersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.name ?? "").toLowerCase().includes(q) || (r.phone ?? "").includes(q));
  }, [rows, search]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim() || !form.phone.trim()) throw new Error("Vui lòng nhập tên và SĐT");
      const { error } = await supabase.from("customers").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã thêm khách hàng");
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      setOpenAdd(false); setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      <AdminTopbar
        title="Khách hàng"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${rows.length} khách`}
        right={<Button onClick={() => setOpenAdd(true)}><Plus size={16} /> Thêm khách</Button>}
      />

      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              {["Họ tên", "SĐT", "Nguồn", "Trạng thái", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading ? (
              <tr><td colSpan={5} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có khách hàng phù hợp.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{r.name}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.phone}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.source ?? "—"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.status ?? "—"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(r.id)}>
                    <Eye size={14} /> Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add customer */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Thêm khách hàng</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
            <div className="space-y-1.5"><Label>Họ tên *</Label>
              <Input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Số điện thoại *</Label>
              <Input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Nguồn</Label>
              <Input value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Trạng thái</Label>
              <Input value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Ghi chú</Label>
              <Textarea value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenAdd(false)}>Huỷ</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : "Lưu"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer 360 drawer */}
      <Sheet open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Hồ sơ khách hàng 360°</SheetTitle>
          </SheetHeader>
          {selected && <Customer360 customer={selected} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Customer360({ customer }: { customer: Customer }) {
  const { data: treatments = [] } = useQuery({
    queryKey: ["customer360", "treatments", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments").select("*").eq("customer_id", customer.id);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["customer360", "orders", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["customer360", "bookings", customer.id],
    queryFn: async () => {
      // bookings store customer_name/phone — best-effort match by phone
      if (!customer.phone) return [];
      const { data, error } = await supabase.from("bookings").select("*").eq("phone", customer.phone).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mt-4 space-y-5">
      <section className="rounded-2xl border border-hairline bg-gradient-to-br from-brand-soft to-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand text-white grid place-items-center font-black text-lg">
            {(customer.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-black text-lg">{customer.name}</div>
            <div className="text-xs text-ink-muted">{customer.status ?? "—"}</div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center gap-2"><Phone size={14} className="text-brand-dark" /> {customer.phone ?? "—"}</div>
          {customer.email && <div className="flex items-center gap-2"><Mail size={14} className="text-brand-dark" /> {customer.email}</div>}
          {customer.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-brand-dark" /> {customer.address}</div>}
          <div className="flex items-center gap-2"><UserIcon size={14} className="text-brand-dark" /> Nguồn: {customer.source ?? "—"}</div>
        </div>
        {customer.note && <div className="mt-3 text-sm bg-white/60 rounded-xl p-2.5">Ghi chú: {customer.note}</div>}
      </section>

      <section>
        <h4 className="font-black mb-2">Liệu trình đang có ({treatments.length})</h4>
        {treatments.length === 0 ? (
          <p className="text-sm text-ink-muted">Chưa có liệu trình.</p>
        ) : (
          <div className="space-y-3">
            {treatments.map((t: Record<string, unknown>) => {
              const used = Number(t.used_sessions ?? 0);
              const total = Number(t.total_sessions ?? 0);
              const pct = total > 0 ? Math.round((used / total) * 100) : 0;
              return (
                <div key={String(t.id)} className="bg-white border border-hairline rounded-2xl p-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{String(t.package_name ?? "Liệu trình")}</span>
                    <span className="text-ink-muted">{used}/{total} buổi</span>
                  </div>
                  <Progress value={pct} className="mt-2" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h4 className="font-black mb-2">Đơn hàng gần nhất ({orders.length})</h4>
        {orders.length === 0 ? <p className="text-sm text-ink-muted">Chưa có đơn hàng.</p> : (
          <ul className="space-y-2">
            {orders.map((o: Record<string, unknown>) => (
              <li key={String(o.id)} className="bg-white border border-hairline rounded-xl p-3 text-sm flex justify-between">
                <span className="font-semibold">{String(o.package_name ?? "—")}</span>
                <span className="text-brand-dark font-bold">{money(Number(o.total_price ?? 0))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="font-black mb-2">Lịch hẹn gần nhất ({bookings.length})</h4>
        {bookings.length === 0 ? <p className="text-sm text-ink-muted">Chưa có lịch hẹn.</p> : (
          <ul className="space-y-2">
            {bookings.map((b: Record<string, unknown>) => (
              <li key={String(b.id)} className="bg-white border border-hairline rounded-xl p-3 text-sm flex justify-between">
                <span className="font-semibold">{String(b.service ?? "—")}</span>
                <span className="text-ink-muted">{String(b.booking_date ?? "")} {String(b.booking_time ?? "")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
