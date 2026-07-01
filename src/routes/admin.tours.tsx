import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/tours")({
  component: ToursPage,
});

type Customer = { id: string; name: string; phone: string | null };
type UserRow = { id: string; full_name: string | null; role: string };
type Treatment = { id: string; order_id: string; customer_id: string; session_number: number; status: string };
type Order = { id: string; service_id: string };
type Service = { id: string; name: string };
type Tour = {
  id: string; treatment_id: string; customer_id: string; technician_id: string;
  notes: string | null; commission_amount: number | null; status: string; created_at: string;
};

function ToursPage() {
  const qc = useQueryClient();

  const customersQ = useQuery({
    queryKey: ["tours", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name,phone").order("name");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["tours", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name,role").in("role", ["admin", "staff", "manager"]);
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });
  const treatmentsQ = useQuery({
    queryKey: ["tours", "treatments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments").select("id,order_id,customer_id,session_number,status").eq("status", "pending").order("session_number");
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });
  const ordersQ = useQuery({
    queryKey: ["tours", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id,service_id");
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
  const servicesQ = useQuery({
    queryKey: ["tours", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const [customerId, setCustomerId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");

  const serviceByOrder = useMemo(() => {
    const smap = new Map((servicesQ.data ?? []).map((s) => [s.id, s.name]));
    const omap = new Map<string, string>();
    (ordersQ.data ?? []).forEach((o) => omap.set(o.id, smap.get(o.service_id) ?? "—"));
    return omap;
  }, [ordersQ.data, servicesQ.data]);

  const availableTreatments = useMemo(() => {
    if (!customerId) return [];
    return (treatmentsQ.data ?? []).filter((t) => t.customer_id === customerId);
  }, [treatmentsQ.data, customerId]);

  const selectedTreatment = availableTreatments.find((t) => t.id === treatmentId);

  const completeTour = useMutation({
    mutationFn: async () => {
      if (!customerId || !treatmentId || !technicianId) throw new Error("Chọn đủ khách hàng, buổi và nhân viên.");
      const commission = Number(commissionAmount || 0);

      const { data: tour, error: tErr } = await supabase.from("tours").insert({
        treatment_id: treatmentId,
        customer_id: customerId,
        technician_id: technicianId,
        notes: notes.trim() || null,
        commission_amount: commission,
        status: "completed",
      }).select().single();
      if (tErr) throw tErr;

      const { error: uErr } = await supabase.from("treatments").update({ status: "completed" }).eq("id", treatmentId);
      if (uErr) throw uErr;

      if (commission > 0) {
        const { error: cErr } = await supabase.from("commissions").insert({
          staff_id: technicianId,
          commission_type: "tour_service",
          reference_id: tour.id,
          amount: commission,
          status: "pending",
        });
        if (cErr) throw cErr;
      }
    },
    onSuccess: () => {
      toast.success("Hoàn thành ca làm!", { description: "Đã trừ 1 buổi + ghi nhận hoa hồng (chờ duyệt)." });
      setTreatmentId(""); setNotes(""); setCommissionAmount("");
      qc.invalidateQueries({ queryKey: ["tours"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AdminTopbar
        title="Quản lý Ca làm (Tours)"
        subtitle="Chia buổi liệu trình cho nhân viên — tự động trừ buổi & ghi nhận hoa hồng."
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <form
          onSubmit={(e) => { e.preventDefault(); completeTour.mutate(); }}
          className="lg:col-span-2 bg-white border border-hairline rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-hairline">
            <div className="size-10 grid place-items-center rounded-xl bg-brand-soft text-brand-dark text-lg font-black">T</div>
            <div>
              <h2 className="font-black text-lg">Ghi nhận ca làm</h2>
              <p className="text-xs text-ink-muted">Chọn khách → buổi liệu trình còn lại → nhân viên thực hiện.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Khách hàng *</Label>
              <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setTreatmentId(""); }}>
                <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                <SelectContent>
                  {(customersQ.data ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}{o.phone ? ` · ${o.phone}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Buổi liệu trình còn lại *</Label>
              <Select value={treatmentId} onValueChange={setTreatmentId} disabled={!customerId}>
                <SelectTrigger><SelectValue placeholder={customerId ? "Chọn buổi" : "Chọn khách trước"} /></SelectTrigger>
                <SelectContent>
                  {availableTreatments.length === 0 && (
                    <div className="px-3 py-2 text-sm text-ink-muted">Khách này không còn buổi pending.</div>
                  )}
                  {availableTreatments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Buổi #{t.session_number} · {serviceByOrder.get(t.order_id) ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nhân viên thực hiện *</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                <SelectContent>
                  {(usersQ.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name ?? "—"} · {u.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Hoa hồng (₫)</Label>
              <Input type="number" min={0} placeholder="VD: 50000"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Tình trạng, phản hồi, lưu ý buổi sau..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => {
              setCustomerId(""); setTreatmentId(""); setTechnicianId(""); setNotes(""); setCommissionAmount("");
            }}>Làm mới</Button>
            <Button type="submit" disabled={completeTour.isPending}>
              {completeTour.isPending ? "Đang xử lý..." : "✓ Hoàn thành Ca làm"}
            </Button>
          </div>
        </form>

        <aside className="bg-gradient-to-br from-brand-soft to-white border border-hairline rounded-2xl p-6 space-y-3 h-fit">
          <h3 className="font-black text-base">Tóm tắt</h3>
          <Row label="Khách" value={(customersQ.data ?? []).find((c) => c.id === customerId)?.name} />
          <Row label="Buổi" value={selectedTreatment ? `#${selectedTreatment.session_number} · ${serviceByOrder.get(selectedTreatment.order_id) ?? ""}` : undefined} />
          <Row label="Nhân viên" value={(usersQ.data ?? []).find((u) => u.id === technicianId)?.full_name ?? undefined} />
          <Row label="Hoa hồng" value={commissionAmount ? Number(commissionAmount).toLocaleString("vi-VN") + " ₫" : undefined} />
          <div className="pt-3 mt-3 border-t border-hairline text-xs text-ink-muted leading-relaxed">
            Bấm <b>Hoàn thành</b>: tạo Tour, chuyển buổi liệu trình sang <i>completed</i>, ghi nhận hoa hồng nhân viên (trạng thái <i>pending</i>).
          </div>
        </aside>
      </div>

      <ToursList />
    </>
  );
}

function ToursList() {
  const [day, setDay] = useState("");
  const [techId, setTechId] = useState("all");

  const usersQ = useQuery({
    queryKey: ["tours-list", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name");
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string | null }[];
    },
  });
  const customersQ = useQuery({
    queryKey: ["tours-list", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });
  const toursQ = useQuery({
    queryKey: ["tours-list", "tours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as Tour[];
    },
  });

  const filtered = (toursQ.data ?? []).filter((t) => {
    if (day && String(t.created_at).slice(0, 10) !== day) return false;
    if (techId !== "all" && t.technician_id !== techId) return false;
    return true;
  });

  const nameOfUser = (id: string) => (usersQ.data ?? []).find((u) => u.id === id)?.full_name ?? "—";
  const nameOfCustomer = (id: string) => (customersQ.data ?? []).find((c) => c.id === id)?.name ?? "—";

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-black text-lg">Danh sách ca làm</h3>
          <p className="text-xs text-ink-muted">Tra cứu theo ngày và nhân viên.</p>
        </div>
        <div className="flex gap-3 items-end bg-white border border-hairline rounded-2xl p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Ngày</Label>
            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-[170px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nhân viên</Label>
            <Select value={techId} onValueChange={setTechId}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {(usersQ.data ?? []).map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name ?? "—"}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[840px] border-collapse">
          <thead>
            <tr>
              {["Thời gian", "Khách hàng", "Nhân viên", "Hoa hồng", "Ghi chú", "Trạng thái"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có ca làm phù hợp.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id}>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{new Date(t.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{nameOfCustomer(t.customer_id)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{nameOfUser(t.technician_id)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">
                  {t.commission_amount ? Number(t.commission_amount).toLocaleString("vi-VN") + " ₫" : "—"}
                </td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] max-w-[280px] truncate">{t.notes ?? ""}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-bold text-right break-words max-w-[60%]">{value || "—"}</span>
    </div>
  );
}
