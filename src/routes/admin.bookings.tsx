import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { StaffDragDropBoard, type StaffMember, type DropTarget } from "@/components/StaffDragDropBoard";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsAdmin,
});

type Customer = { id: string; name: string | null; phone: string | null };
type UserRow = { id: string; full_name: string | null; role: string | null };
type Service = { id: string; name: string };
type Booking = {
  id: string; customer_id: string | null; service_id: string | null;
  assigned_staff_id: string | null; booking_at: string | null; notes: string | null;
  status: string | null;
  customer_name: string | null; phone: string | null; service: string | null;
  booking_date: string | null; booking_time: string | null; note: string | null;
  created_at: string | null;
};

const OPEN_STATUSES = ["pending", "Chờ xác nhận"];
const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

function BookingsAdmin() {
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const bookingsQ = useQuery({
    queryKey: ["bookings2"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("booking_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["bookings2", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name,role");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });
  const customersQ = useQuery({
    queryKey: ["bookings2", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name,phone").order("name");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });
  const servicesQ = useQuery({
    queryKey: ["bookings2", "services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const userMap = useMemo(() => new Map((usersQ.data ?? []).map((u) => [u.id, u])), [usersQ.data]);
  const custMap = useMemo(() => new Map((customersQ.data ?? []).map((c) => [c.id, c])), [customersQ.data]);
  const svcMap = useMemo(() => new Map((servicesQ.data ?? []).map((s) => [s.id, s])), [servicesQ.data]);

  const allStaff: StaffMember[] = useMemo(
    () =>
      (usersQ.data ?? [])
        .filter((u) => u.role && u.role !== "customer")
        .map((u) => ({ id: u.id, full_name: u.full_name ?? "—", role: u.role ?? "staff" })),
    [usersQ.data],
  );

  const openBookings = useMemo(
    () => (bookingsQ.data ?? []).filter((b) => OPEN_STATUSES.includes(b.status ?? "")),
    [bookingsQ.data],
  );

  function highlightOf(iso: string | null): DropTarget["highlight"] {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - now;
    if (diff < 0) return "danger";
    if (diff <= 10 * 60_000) return "danger";
    if (diff <= 30 * 60_000) return "warn";
    return null;
  }

  const targets: DropTarget[] = useMemo(() => {
    return openBookings.map((b) => {
      const cust = b.customer_id ? custMap.get(b.customer_id) : null;
      const svc = b.service_id ? svcMap.get(b.service_id) : null;
      const staff = b.assigned_staff_id ? userMap.get(b.assigned_staff_id) : null;
      const custName = cust?.name ?? b.customer_name ?? "Khách";
      const phone = cust?.phone ?? b.phone ?? "";
      const svcName = svc?.name ?? b.service ?? "—";
      const when = b.booking_at
        ? new Date(b.booking_at).toLocaleString("vi-VN")
        : [b.booking_date, b.booking_time].filter(Boolean).join(" ");
      return {
        id: b.id,
        title: `${custName}${phone ? ` · ${phone}` : ""}`,
        subtitle: `${svcName} · ${when || "chưa chốt giờ"}`,
        badge: STATUS_LABEL[b.status ?? ""] ?? b.status ?? "—",
        highlight: highlightOf(b.booking_at),
        assigneeId: b.assigned_staff_id,
        assigneeName: staff?.full_name ?? null,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openBookings, custMap, svcMap, userMap, now]);

  // Reassign / assign
  const [pending, setPending] = useState<{ staffId: string; bookingId: string } | null>(null);
  const assign = useMutation({
    mutationFn: async (v: { staffId: string; bookingId: string }) => {
      const booking = (bookingsQ.data ?? []).find((b) => b.id === v.bookingId);
      const prevStaffId = booking?.assigned_staff_id ?? null;
      const { error } = await supabase.from("bookings")
        .update({ assigned_staff_id: v.staffId, status: "confirmed" })
        .eq("id", v.bookingId);
      if (error) throw error;

      // notify new assignee
      const newStaff = userMap.get(v.staffId);
      await supabase.from("notifications").insert({
        recipient_id: v.staffId,
        type: prevStaffId ? "booking_reassigned" : "booking_assigned",
        title: prevStaffId ? "Bạn được gán lại 1 lịch hẹn" : "Bạn được gán 1 lịch hẹn",
        body: `${booking?.customer_name ?? custMap.get(booking?.customer_id ?? "")?.name ?? "Khách"} · ${
          booking?.booking_at ? new Date(booking.booking_at).toLocaleString("vi-VN") : "chưa chốt giờ"
        }`,
        ref_type: "booking",
        ref_id: v.bookingId,
      });
      // notify old assignee if reassign
      if (prevStaffId && prevStaffId !== v.staffId) {
        await supabase.from("notifications").insert({
          recipient_id: prevStaffId,
          type: "booking_reassigned",
          title: "Lịch hẹn của bạn đã được chuyển cho người khác",
          body: `Được chuyển cho ${newStaff?.full_name ?? "nhân viên khác"}.`,
          ref_type: "booking",
          ref_id: v.bookingId,
        });
      }
    },
    onSuccess: () => {
      toast.success("Đã gán nhân viên & xác nhận lịch");
      setPending(null);
      qc.invalidateQueries({ queryKey: ["bookings2"] });
    },
    onError: (e: Error) => { toast.error(e.message); setPending(null); },
  });

  // Cancel booking
  const cancel = useMutation({
    mutationFn: async (bookingId: string) => {
      const booking = (bookingsQ.data ?? []).find((b) => b.id === bookingId);
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
      if (error) throw error;
      if (booking?.assigned_staff_id) {
        await supabase.from("notifications").insert({
          recipient_id: booking.assigned_staff_id,
          type: "booking_cancelled",
          title: "1 lịch hẹn đã bị huỷ",
          body: `${booking.customer_name ?? custMap.get(booking.customer_id ?? "")?.name ?? "Khách"} · ${
            booking.booking_at ? new Date(booking.booking_at).toLocaleString("vi-VN") : ""
          }`,
          ref_type: "booking",
          ref_id: bookingId,
        });
      }
    },
    onSuccess: () => {
      toast.success("Đã huỷ lịch hẹn");
      qc.invalidateQueries({ queryKey: ["bookings2"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <AdminTopbar
        title="Lịch hẹn"
        subtitle="Kéo thẻ nhân viên vào lịch hẹn để phân công. Viền đỏ = sắp tới giờ."
        right={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4 mr-1" />Tạo Lịch hẹn mới</Button>}
      />

      <StaffDragDropBoard
        staff={allStaff}
        targets={targets}
        onAssign={(staffId, bookingId) => setPending({ staffId, bookingId })}
        leftTitle="Toàn bộ nhân sự"
        rightTitle="Lịch hẹn đang mở"
        emptyStaffText="Chưa có nhân viên."
        emptyTargetsText="Không có lịch hẹn nào cần phân công."
      />

      <BookingHistoryTable
        rows={bookingsQ.data ?? []}
        custMap={custMap}
        svcMap={svcMap}
        userMap={userMap}
        onCancel={(id) => cancel.mutate(id)}
      />

      <CreateBookingSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        customers={customersQ.data ?? []}
        services={servicesQ.data ?? []}
        onCreated={() => qc.invalidateQueries({ queryKey: ["bookings2"] })}
      />

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phân công</DialogTitle>
            <DialogDescription>
              Gán <b>{pending ? userMap.get(pending.staffId)?.full_name ?? "—" : ""}</b> cho lịch hẹn này?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>Huỷ</Button>
            <Button onClick={() => pending && assign.mutate(pending)} disabled={assign.isPending}>
              {assign.isPending ? "Đang lưu…" : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------ Create Booking Sheet ------------------ */

function CreateBookingSheet({
  open, onOpenChange, customers, services, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  customers: Customer[]; services: Service[]; onCreated: () => void;
}) {
  const [customerId, setCustomerId] = useState<string>("__new");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [bookingAt, setBookingAt] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    try {
      setSaving(true);
      let finalCustomerId: string | null = null;
      let custName = name.trim();
      let custPhone = phone.trim();

      if (customerId && customerId !== "__new") {
        const c = customers.find((x) => x.id === customerId);
        finalCustomerId = customerId;
        custName = c?.name ?? custName;
        custPhone = c?.phone ?? custPhone;
      } else {
        if (!custName || !custPhone) throw new Error("Nhập tên và SĐT khách hàng.");
        const { data: newC, error: cErr } = await supabase
          .from("customers")
          .insert({ name: custName, full_name: custName, phone: custPhone })
          .select().single();
        if (cErr) throw cErr;
        finalCustomerId = newC.id;
      }

      if (!bookingAt) throw new Error("Chọn thời gian hẹn.");
      const iso = new Date(bookingAt).toISOString();

      const svc = services.find((s) => s.id === serviceId);
      const { error } = await supabase.from("bookings").insert({
        customer_id: finalCustomerId,
        service_id: serviceId || null,
        booking_at: iso,
        notes: notes.trim() || null,
        status: "pending",
        // Legacy columns (NOT NULL) — mirror for compatibility
        customer_name: custName,
        phone: custPhone,
        service: svc?.name ?? null,
        booking_date: iso.slice(0, 10),
        booking_time: new Date(iso).toTimeString().slice(0, 5),
        note: notes.trim() || null,
      });
      if (error) throw error;

      toast.success("Đã tạo lịch hẹn");
      onOpenChange(false);
      setName(""); setPhone(""); setServiceId(""); setBookingAt(""); setNotes(""); setCustomerId("__new");
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tạo Lịch hẹn mới</SheetTitle>
          <SheetDescription>Chọn khách sẵn có hoặc tạo khách ẩn ngay khi lưu.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>Khách hàng</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__new">+ Khách mới (nhập tay bên dưới)</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name ?? "—"}{c.phone ? ` · ${c.phone}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customerId === "__new" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tên khách *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-1.5">
                <Label>SĐT *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx…" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Dịch vụ</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Thời gian hẹn *</Label>
            <Input type="datetime-local" value={bookingAt} onChange={(e) => setBookingAt(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Đang lưu…" : "Lưu lịch hẹn"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------ History table ------------------ */

function BookingHistoryTable({
  rows, custMap, svcMap, userMap, onCancel,
}: {
  rows: Booking[];
  custMap: Map<string, Customer>;
  svcMap: Map<string, Service>;
  userMap: Map<string, UserRow>;
  onCancel: (id: string) => void;
}) {
  return (
    <section className="mt-8">
      <h3 className="font-black text-lg mb-3">Toàn bộ lịch hẹn</h3>
      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              {["Thời gian", "Khách", "Dịch vụ", "Nhân viên", "Trạng thái", "Thao tác"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted">Không có lịch hẹn.</td></tr>
            ) : rows.map((r) => {
              const cust = r.customer_id ? custMap.get(r.customer_id) : null;
              const svc = r.service_id ? svcMap.get(r.service_id) : null;
              const staff = r.assigned_staff_id ? userMap.get(r.assigned_staff_id) : null;
              const when = r.booking_at
                ? new Date(r.booking_at).toLocaleString("vi-VN")
                : [r.booking_date, r.booking_time].filter(Boolean).join(" ");
              const st = r.status ?? "—";
              return (
                <tr key={r.id}>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{when || "—"}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">
                    {cust?.name ?? r.customer_name ?? "—"}
                    {(cust?.phone ?? r.phone) && <div className="text-xs text-ink-muted">{cust?.phone ?? r.phone}</div>}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{svc?.name ?? r.service ?? "—"}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{staff?.full_name ?? "—"}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      st === "cancelled" || st === "Đã hủy" ? "bg-rose-100 text-rose-800" :
                      st === "completed" || st === "Hoàn thành" ? "bg-emerald-100 text-emerald-800" :
                      st === "confirmed" || st === "Đã xác nhận" ? "bg-blue-100 text-blue-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>{STATUS_LABEL[st] ?? st}</span>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {st !== "cancelled" && st !== "Đã hủy" && st !== "completed" && st !== "Hoàn thành" && (
                      <Button size="sm" variant="ghost" onClick={() => onCancel(r.id)}>Huỷ</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
