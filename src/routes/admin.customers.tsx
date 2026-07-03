import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Eye, Phone, Mail, MapPin, User as UserIcon, Pencil, Trash2 } from "lucide-react";
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
import { useServerFn } from "@tanstack/react-start";
import { createCustomerWithAuth } from "@/lib/employees.functions";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersAdmin,
});

type Customer = {
  id: string; name: string | null; full_name?: string | null; phone: string | null;
  email?: string | null; dob?: string | null; gender?: string | null; notes?: string | null;
  source: string | null; note: string | null; status: string | null;
  address?: string | null;
};

const EMPTY = {
  full_name: "",
  phone: "",
  email: "",
  dob: "",
  gender: "",
  source: "",
  status: "Đang chăm sóc",
  notes: "",
};

const money = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function CustomersAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
    return rows.filter((r) => (r.full_name ?? r.name ?? "").toLowerCase().includes(q) || (r.phone ?? "").includes(q));
  }, [rows, search]);

  const openCreateForm = () => {
    setEditingCustomer(null);
    setForm(EMPTY);
    setOpenAdd(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      full_name: customer.full_name ?? customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      dob: customer.dob ?? "",
      gender: customer.gender ?? "",
      source: customer.source ?? "",
      status: customer.status ?? "Đang chăm sóc",
      notes: customer.notes ?? customer.note ?? "",
    });
    setOpenAdd(true);
  };

  const closeForm = () => {
    setOpenAdd(false);
    setEditingCustomer(null);
    setForm(EMPTY);
  };

  const createFn = useServerFn(createCustomerWithAuth);

  const save = useMutation({
    mutationFn: async () => {
      const fullName = form.full_name.trim();
      const phone = form.phone.trim().replace(/\s+/g, "");
      if (!fullName || !phone) throw new Error("Vui lòng nhập họ tên và SĐT");

      if (editingCustomer) {
        const payload = {
          full_name: fullName,
          name: fullName,
          phone,
          email: form.email.trim() || null,
          dob: form.dob || null,
          gender: form.gender || null,
          source: form.source.trim() || null,
          status: form.status.trim() || "Đang chăm sóc",
          notes: form.notes.trim() || null,
          note: form.notes.trim() || null,
        };
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", editingCustomer.id);
        if (error) throw new Error(error.message || "Không thể lưu khách hàng");
      } else {
        // Tạo mới: gọi server fn (service role) — tự sinh Auth account
        // theo SĐT (email=<phone>@khach.vitath.pro, password=<phone>).
        await createFn({
          data: {
            full_name: fullName,
            phone,
            email: form.email.trim() || null,
            dob: form.dob || null,
            gender: form.gender || null,
            source: form.source.trim() || null,
            status: form.status.trim() || "Đang chăm sóc",
            notes: form.notes.trim() || null,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingCustomer
          ? "Đã cập nhật khách hàng"
          : "Đã thêm khách hàng + tạo tài khoản đăng nhập (SĐT / SĐT)",
      );
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
      closeForm();
    },
    onError: (e: Error) => toast.error(`Không thể lưu khách hàng: ${e.message}`),
  });

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      <AdminTopbar
        title="Khách hàng"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${rows.length} khách`}
        right={<Button onClick={openCreateForm}><Plus size={16} /> Thêm khách</Button>}
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
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{r.full_name ?? r.name}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.phone}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.source ?? "—"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.status ?? "—"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedId(r.id)}>
                      <Eye size={14} /> Xem chi tiết
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditForm(r)}>
                      <Pencil size={14} /> Sửa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add customer */}
      <Dialog open={openAdd} onOpenChange={(v) => (v ? setOpenAdd(true) : closeForm())}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCustomer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
            <div className="space-y-1.5"><Label>Họ tên *</Label>
              <Input required value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Số điện thoại *</Label>
              <Input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Ngày sinh</Label>
                <Input type="date" value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Giới tính</Label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Nam">Nam</option>
                  <option value="Khác">Khác</option>
                </select></div>
            </div>
            <div className="space-y-1.5"><Label>Nguồn</Label>
              <Input value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Trạng thái</Label>
              <Input value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Ghi chú y tế</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeForm}>Huỷ</Button>
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
            {(customer.full_name ?? customer.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-black text-lg">{customer.full_name ?? customer.name}</div>
            <div className="text-xs text-ink-muted">{customer.status ?? "—"}</div>
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center gap-2"><Phone size={14} className="text-brand-dark" /> {customer.phone ?? "—"}</div>
          {customer.email && <div className="flex items-center gap-2"><Mail size={14} className="text-brand-dark" /> {customer.email}</div>}
          {customer.dob && <div className="flex items-center gap-2"><UserIcon size={14} className="text-brand-dark" /> Ngày sinh: {customer.dob}</div>}
          {customer.gender && <div className="flex items-center gap-2"><UserIcon size={14} className="text-brand-dark" /> Giới tính: {customer.gender}</div>}
          {customer.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-brand-dark" /> {customer.address}</div>}
          <div className="flex items-center gap-2"><UserIcon size={14} className="text-brand-dark" /> Nguồn: {customer.source ?? "—"}</div>
        </div>
        {(customer.notes || customer.note) && <div className="mt-3 text-sm bg-white/60 rounded-xl p-2.5">Ghi chú y tế: {customer.notes ?? customer.note}</div>}
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
