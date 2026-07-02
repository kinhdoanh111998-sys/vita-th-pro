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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DraggableStaff, DroppableTarget, type StaffMember, type DropTarget } from "@/components/StaffDragDropBoard";
import { AssignDndProvider } from "@/components/AssignDndProvider";
import { Input as UIInput } from "@/components/ui/input";
import { Search } from "lucide-react";


export const Route = createFileRoute("/admin/tours")({
  component: ToursPage,
});

type Customer = { id: string; name: string | null; phone: string | null };
type UserRow = { id: string; full_name: string | null; role: string | null };
type Treatment = {
  id: string; order_id: string; customer_id: string; session_number: number;
  status: string; service_id: string | null; created_at: string;
};
type Service = { id: string; name: string };
type Attendance = { employee_id: string; check_in_approved: boolean; check_out_time: string | null };
type TourRow = {
  id: string; treatment_id: string; customer_id: string; technician_id: string;
  notes: string | null; commission_amount: number | null; status: string; created_at: string;
};

const STAFF_ROLES = ["staff", "technician", "sale"];
const todayISO = () => new Date().toISOString().slice(0, 10);

function ToursPage() {
  const qc = useQueryClient();
  const today = todayISO();

  const customersQ = useQuery({
    queryKey: ["tours2", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name,phone");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["tours2", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name,role");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });
  const treatmentsQ = useQuery({
    queryKey: ["tours2", "treatments-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id,order_id,customer_id,session_number,status,service_id,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });
  const servicesQ = useQuery({
    queryKey: ["tours2", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
  const attQ = useQuery({
    queryKey: ["tours2", "attendances", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("employee_id,check_in_approved,check_out_time")
        .eq("date", today);
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
  });
  const activeToursQ = useQuery({
    queryKey: ["tours2", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("technician_id,status")
        .eq("status", "in_progress");
      if (error) throw error;
      return (data ?? []) as { technician_id: string; status: string }[];
    },
  });

  const serviceMap = useMemo(
    () => new Map((servicesQ.data ?? []).map((s) => [s.id, s.name])),
    [servicesQ.data],
  );
  const customerMap = useMemo(
    () => new Map((customersQ.data ?? []).map((c) => [c.id, c])),
    [customersQ.data],
  );
  const userMap = useMemo(
    () => new Map((usersQ.data ?? []).map((u) => [u.id, u])),
    [usersQ.data],
  );

  const availableStaff: StaffMember[] = useMemo(() => {
    const busy = new Set((activeToursQ.data ?? []).map((t) => t.technician_id));
    const attMap = new Map((attQ.data ?? []).map((a) => [a.employee_id, a]));
    return (usersQ.data ?? [])
      .filter((u) => u.role && STAFF_ROLES.includes(u.role))
      .filter((u) => {
        const a = attMap.get(u.id);
        return a && a.check_in_approved && !a.check_out_time && !busy.has(u.id);
      })
      .map((u) => ({
        id: u.id,
        full_name: u.full_name ?? "—",
        role: u.role ?? "staff",
        meta: "Sẵn sàng",
      }));
  }, [usersQ.data, attQ.data, activeToursQ.data]);

  const targets: DropTarget[] = useMemo(() => {
    return (treatmentsQ.data ?? []).map((t) => {
      const cust = customerMap.get(t.customer_id);
      const svcName = t.service_id ? serviceMap.get(t.service_id) ?? "—" : "—";
      return {
        id: t.id,
        title: `${cust?.name ?? "Khách"} · Buổi #${t.session_number}`,
        subtitle: `${svcName}${cust?.phone ? ` · ${cust.phone}` : ""}`,
        badge: "PENDING",
        assigneeId: null,
        assigneeName: null,
      };
    });
  }, [treatmentsQ.data, customerMap, serviceMap]);

  // Confirm dialog
  const [pending, setPending] = useState<{ staffId: string; treatmentId: string } | null>(null);

  const assign = useMutation({
    mutationFn: async (v: { staffId: string; treatmentId: string }) => {
      const t = (treatmentsQ.data ?? []).find((x) => x.id === v.treatmentId);
      if (!t) throw new Error("Không tìm thấy buổi liệu trình.");
      const now = new Date().toISOString();
      const { error: tErr } = await supabase.from("tours").insert({
        treatment_id: t.id,
        customer_id: t.customer_id,
        technician_id: v.staffId,
        status: "in_progress",
        start_time: now,
      });
      if (tErr) throw tErr;
      const { error: uErr } = await supabase.from("treatments").update({ status: "in_progress" }).eq("id", t.id);
      if (uErr) throw uErr;

      // Log notification cho nhân viên được gán
      await supabase.from("notifications").insert({
        recipient_id: v.staffId,
        type: "tour_assigned",
        title: "Bạn được gán 1 ca mới",
        body: `${customerMap.get(t.customer_id)?.name ?? "Khách"} · Buổi #${t.session_number}`,
        ref_type: "treatment",
        ref_id: t.id,
      });
    },
    onSuccess: () => {
      toast.success("Đã bắt đầu ca làm");
      setPending(null);
      qc.invalidateQueries({ queryKey: ["tours2"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setPending(null);
    },
  });

  const pendingStaff = pending ? userMap.get(pending.staffId) : null;
  const pendingTreat = pending ? (treatmentsQ.data ?? []).find((t) => t.id === pending.treatmentId) : null;
  const pendingCust = pendingTreat ? customerMap.get(pendingTreat.customer_id) : null;

  const [staffQ, setStaffQ] = useState("");
  const filteredStaff = availableStaff.filter((s) =>
    !staffQ.trim()
      ? true
      : s.full_name.toLowerCase().includes(staffQ.trim().toLowerCase()),
  );

  return (
    <>

      <AdminTopbar
        title="Quản lý Ca làm (Tours)"
        subtitle="Kéo thẻ nhân viên khả dụng thả vào buổi liệu trình cần thực hiện."
      />

      <AssignDndProvider
        staff={availableStaff}
        onAssign={(staffId, treatmentId) => setPending({ staffId, treatmentId })}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* CỘT TRÁI/GIỮA: Card liệu trình = drop zones */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm">
                Liệu trình cần làm{" "}
                <span className="text-ink-muted font-semibold">
                  ({targets.length})
                </span>
              </h3>
            </div>
            {targets.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-hairline bg-white p-10 text-center text-ink-muted text-sm">
                Không có buổi liệu trình nào đang chờ.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {targets.map((t) => (
                  <DroppableTarget key={t.id} t={t} activeStaffId={null} />
                ))}
              </div>
            )}
          </section>

          {/* CỘT PHẢI: Tóm tắt + Staff Pool compact */}
          <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
            <div className="bg-white border border-hairline rounded-2xl p-4">
              <h4 className="font-black text-sm mb-3">Tóm tắt</h4>
              <dl className="text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Liệu trình chờ</dt>
                  <dd className="font-bold text-brand-dark">{targets.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Nhân viên rảnh</dt>
                  <dd className="font-bold text-brand-dark">{availableStaff.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">Đang thực hiện</dt>
                  <dd className="font-bold text-amber-700">
                    {activeToursQ.data?.length ?? 0}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-ink-muted leading-relaxed">
                Kéo thẻ nhân viên bên dưới thả vào một card liệu trình để tạo Tour
                <i> in_progress</i> và gửi thông báo.
              </p>
            </div>

            <div className="bg-white border border-hairline rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="font-black text-sm">
                  Nhân viên khả dụng{" "}
                  <span className="text-ink-muted font-semibold">
                    ({filteredStaff.length})
                  </span>
                </h4>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
                <UIInput
                  value={staffQ}
                  onChange={(e) => setStaffQ(e.target.value)}
                  placeholder="Tìm nhân viên…"
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {filteredStaff.length === 0 ? (
                <div className="text-[11px] text-ink-muted italic text-center py-4">
                  Không có nhân viên đã check-in/rảnh.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                  {filteredStaff.map((s) => (
                    <DraggableStaff key={s.id} s={s} compact />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </AssignDndProvider>


      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận bắt đầu ca</DialogTitle>
            <DialogDescription>
              Gán <b>{pendingStaff?.full_name ?? "—"}</b> thực hiện buổi{" "}
              <b>#{pendingTreat?.session_number}</b> cho khách <b>{pendingCust?.name ?? "—"}</b>?
              Hệ thống sẽ tạo Tour trạng thái <i>in_progress</i> và chuyển buổi liệu trình sang <i>in_progress</i>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>Huỷ</Button>
            <Button onClick={() => pending && assign.mutate(pending)} disabled={assign.isPending}>
              {assign.isPending ? "Đang xử lý…" : "Bắt đầu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToursHistory />
      <ManualTourForm />
    </>
  );
}

/* ------------------ Manual form (giữ lại chức năng hoàn thành thủ công) ------------------ */

function ManualTourForm() {
  const qc = useQueryClient();
  const customersQ = useQuery({
    queryKey: ["tour-manual", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name,phone").order("name");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["tour-manual", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name,role");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });
  const treatmentsQ = useQuery({
    queryKey: ["tour-manual", "treatments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments")
        .select("id,customer_id,session_number,status")
        .in("status", ["pending", "in_progress"]).order("session_number");
      if (error) throw error;
      return (data ?? []) as { id: string; customer_id: string; session_number: number; status: string }[];
    },
  });

  const [customerId, setCustomerId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");

  const list = (treatmentsQ.data ?? []).filter((t) => !customerId || t.customer_id === customerId);

  const complete = useMutation({
    mutationFn: async () => {
      if (!customerId || !treatmentId || !technicianId) throw new Error("Chọn đủ khách, buổi và nhân viên.");
      const commission = Number(commissionAmount || 0);
      const now = new Date().toISOString();
      const { data: tour, error: tErr } = await supabase.from("tours").insert({
        treatment_id: treatmentId, customer_id: customerId, technician_id: technicianId,
        notes: notes.trim() || null, commission_amount: commission, status: "completed",
        start_time: now, end_time: now,
      }).select().single();
      if (tErr) throw tErr;
      const { error: uErr } = await supabase.from("treatments").update({ status: "completed" }).eq("id", treatmentId);
      if (uErr) throw uErr;
      if (commission > 0) {
        await supabase.from("commissions").insert({
          staff_id: technicianId, commission_type: "tour_service",
          reference_id: tour.id, amount: commission, status: "pending",
        });
      }
    },
    onSuccess: () => {
      toast.success("Đã hoàn thành ca làm.");
      setTreatmentId(""); setNotes(""); setCommissionAmount("");
      qc.invalidateQueries({ queryKey: ["tours2"] });
      qc.invalidateQueries({ queryKey: ["tour-manual"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-8">
      <h3 className="font-black text-lg mb-3">Hoàn thành buổi (thủ công)</h3>
      <form
        onSubmit={(e) => { e.preventDefault(); complete.mutate(); }}
        className="bg-white border border-hairline rounded-2xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="space-y-1.5">
          <Label>Khách hàng</Label>
          <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setTreatmentId(""); }}>
            <SelectTrigger><SelectValue placeholder="Chọn khách" /></SelectTrigger>
            <SelectContent>
              {(customersQ.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Buổi liệu trình</Label>
          <Select value={treatmentId} onValueChange={setTreatmentId} disabled={!customerId}>
            <SelectTrigger><SelectValue placeholder="Chọn buổi" /></SelectTrigger>
            <SelectContent>
              {list.map((t) => (
                <SelectItem key={t.id} value={t.id}>Buổi #{t.session_number} · {t.status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Nhân viên</Label>
          <Select value={technicianId} onValueChange={setTechnicianId}>
            <SelectTrigger><SelectValue placeholder="Chọn NV" /></SelectTrigger>
            <SelectContent>
              {(usersQ.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name ?? "—"} · {u.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Hoa hồng (₫)</Label>
          <Input type="number" min={0} value={commissionAmount} onChange={(e) => setCommissionAmount(e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
          <Label>Ghi chú</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
          <Button type="submit" className="w-full" disabled={complete.isPending}>
            {complete.isPending ? "Đang xử lý…" : "✓ Hoàn thành"}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ------------------ Lịch sử ca làm ------------------ */

function ToursHistory() {
  const toursQ = useQuery({
    queryKey: ["tours2", "history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as TourRow[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["tours2", "users-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name");
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string | null }[];
    },
  });
  const customersQ = useQuery({
    queryKey: ["tours2", "customers-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string | null }[];
    },
  });

  const uname = (id: string) => (usersQ.data ?? []).find((u) => u.id === id)?.full_name ?? "—";
  const cname = (id: string) => (customersQ.data ?? []).find((c) => c.id === id)?.name ?? "—";

  return (
    <section className="mt-8">
      <h3 className="font-black text-lg mb-3">Lịch sử ca làm gần nhất</h3>
      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              {["Thời gian", "Khách", "Nhân viên", "Trạng thái", "Hoa hồng"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(toursQ.data ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{new Date(t.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{cname(t.customer_id)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{uname(t.technician_id)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    t.status === "in_progress" ? "bg-amber-100 text-amber-800" :
                    t.status === "cancelled" ? "bg-rose-100 text-rose-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>{t.status}</span>
                </td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">
                  {t.commission_amount ? Number(t.commission_amount).toLocaleString("vi-VN") + " ₫" : "—"}
                </td>
              </tr>
            ))}
            {(toursQ.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-3.5 py-10 text-center text-ink-muted">Chưa có ca làm nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
