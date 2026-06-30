import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/portal/bookings")({
  component: PortalBookings,
});

type Booking = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  service: string | null;
  booking_date: string | null;
  booking_time: string | null;
  note: string | null;
  status: string | null;
  created_at: string | null;
};

type Technician = { id: string; full_name: string | null; role: string | null };
type Treatment = {
  id: string;
  package_name: string | null;
  customer_id: string | null;
  remaining_sessions: number | null;
};

type Customer = { id: string; name: string | null; phone: string | null };
type Service = { id: string; name: string | null };

function PortalBookings() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Booking | null>(null);
  const [technicianId, setTechnicianId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");

  // Create booking modal
  const [createOpen, setCreateOpen] = useState(false);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [cService, setCService] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customersQ = useQuery({
    queryKey: ["portal", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const servicesQ = useQuery({
    queryKey: ["portal", "catalog-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const resetCreate = () => {
    setIsNewCustomerMode(false);
    setSelectedCustomerId("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setCustomerSearch("");
    setCService("");
    setBookingDate("");
    setBookingTime("");
    setNotes("");
  };

  const refetchBookings = () => {
    qc.invalidateQueries({ queryKey: ["portal", "bookings"] });
    qc.invalidateQueries({ queryKey: ["portal", "bookings-pending-count"] });
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let customerIdToUse: string | null = null;

      if (isNewCustomerMode) {
        if (!newCustomerName || !newCustomerPhone) {
          throw new Error("Vui lòng nhập đầy đủ Tên và SĐT khách mới.");
        }
        const { data: existingCust } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", newCustomerPhone)
          .maybeSingle();
        if (existingCust) {
          customerIdToUse = existingCust.id;
        } else {
          const { data: newCust, error: cErr } = await supabase
            .from("customers")
            .insert({ name: newCustomerName, phone: newCustomerPhone })
            .select("id")
            .single();
          if (cErr) throw cErr;
          customerIdToUse = newCust.id;
        }
      } else {
        if (!selectedCustomerId) throw new Error("Vui lòng chọn một khách hàng.");
        customerIdToUse = selectedCustomerId;
      }

      if (!cService) throw new Error("Vui lòng chọn dịch vụ.");
      if (!bookingDate || !bookingTime)
        throw new Error("Vui lòng chọn ngày & giờ hẹn.");

      const custInfo =
        customersQ.data?.find((c) => c.id === customerIdToUse) ?? null;
      const finalName = isNewCustomerMode ? newCustomerName : custInfo?.name ?? null;
      const finalPhone = isNewCustomerMode
        ? newCustomerPhone
        : custInfo?.phone ?? null;

      const { error: bErr } = await supabase.from("bookings").insert({
        customer_id: customerIdToUse,
        customer_name: finalName,
        phone: finalPhone,
        service: cService,
        booking_date: bookingDate,
        booking_time: bookingTime,
        note: notes || null,
        status: "pending",
      });
      if (bErr) throw bErr;

      toast.success("Tạo lịch hẹn thành công!");
      setCreateOpen(false);
      resetCreate();
      refetchBookings();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi hệ thống";
      console.error("Lỗi khi tạo lịch:", error);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookingsQ = useQuery({
    queryKey: ["portal", "bookings", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "pending")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Booking[];
    },
  });

  const techniciansQ = useQuery({
    queryKey: ["portal", "technicians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, role")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Technician[];
    },
  });

  const treatmentsQ = useQuery({
    queryKey: ["portal", "treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, package_name, customer_id, remaining_sessions")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  const selectedTreatment = useMemo(
    () => treatmentsQ.data?.find((t) => t.id === treatmentId),
    [treatmentsQ.data, treatmentId],
  );

  const dispatch = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Chưa chọn lịch hẹn.");
      if (!technicianId) throw new Error("Vui lòng chọn kỹ thuật viên.");
      if (!treatmentId || !selectedTreatment) throw new Error("Vui lòng chọn liệu trình.");

      const customerId = selectedTreatment.customer_id;
      if (!customerId)
        throw new Error("Liệu trình này chưa gán khách hàng, không thể tạo ca làm.");

      const [tourRes, bookingRes] = await Promise.all([
        supabase.from("tours").insert([
          {
            treatment_id: treatmentId,
            customer_id: customerId,
            technician_id: technicianId,
            notes: active.note ?? `Điều phối từ lịch hẹn #${active.id}`,
            status: "scheduled",
          },
        ]),
        supabase.from("bookings").update({ status: "completed" }).eq("id", active.id),
      ]);
      if (tourRes.error) throw tourRes.error;
      if (bookingRes.error) throw bookingRes.error;
    },
    onSuccess: () => {
      toast.success("Đã điều phối ca làm và cập nhật lịch hẹn.");
      qc.invalidateQueries({ queryKey: ["portal", "bookings"] });
      qc.invalidateQueries({ queryKey: ["portal", "bookings-pending-count"] });
      qc.invalidateQueries({ queryKey: ["portal", "tours-today"] });
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openModal = (b: Booking) => {
    setActive(b);
    setTechnicianId("");
    setTreatmentId("");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setActive(null);
    setTechnicianId("");
    setTreatmentId("");
  };

  const rows = bookingsQ.data ?? [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <div className="bg-white border border-hairline rounded-2xl p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Điều phối Lịch hẹn</h1>
          <p className="text-ink-muted font-medium text-sm mt-1">
            {bookingsQ.isLoading
              ? "Đang tải..."
              : `${rows.length} lịch hẹn đang chờ điều phối (status = pending).`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ Tạo lịch hẹn</Button>
      </div>

      {bookingsQ.error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {(bookingsQ.error as Error).message}
        </div>
      )}

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr>
              {["Khách hàng", "SĐT", "Dịch vụ", "Ngày", "Giờ", "Ghi chú", "Thao tác"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !bookingsQ.isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3.5 py-10 text-center text-ink-muted font-semibold"
                >
                  Không có lịch hẹn nào đang chờ.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">
                    {r.customer_name ?? "-"}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {r.phone ?? "-"}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {r.service ?? "-"}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {r.booking_date ?? "-"}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {r.booking_time ?? "-"}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] max-w-[220px] truncate">
                    {r.note ?? ""}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <Button size="sm" onClick={() => openModal(r)}>
                      Điều phối Ca
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeModal())}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Điều phối Ca làm</DialogTitle>
            <DialogDescription>
              Gán Kỹ thuật viên và Liệu trình cho lịch hẹn. Khi xác nhận, hệ thống tạo
              ca làm mới và đánh dấu lịch hẹn đã hoàn tất điều phối.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-[#f3f7f3] border border-hairline rounded-xl p-3">
              <ReadOnly label="Khách hàng" value={active?.customer_name ?? "—"} />
              <ReadOnly label="SĐT" value={active?.phone ?? "—"} />
              <ReadOnly label="Dịch vụ" value={active?.service ?? "—"} />
              <ReadOnly
                label="Lịch hẹn"
                value={[active?.booking_date, active?.booking_time].filter(Boolean).join(" ") || "—"}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kỹ thuật viên *</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỹ thuật viên" />
                </SelectTrigger>
                <SelectContent>
                  {(techniciansQ.data ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name ?? "—"}
                      {t.role ? ` · ${t.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Liệu trình *</Label>
              <Select value={treatmentId} onValueChange={setTreatmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn liệu trình" />
                </SelectTrigger>
                <SelectContent>
                  {(treatmentsQ.data ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.package_name ?? "Liệu trình"} · còn{" "}
                      {t.remaining_sessions ?? 0} buổi
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTreatment && !selectedTreatment.customer_id && (
                <p className="text-xs text-destructive">
                  Liệu trình này chưa gắn khách hàng, không thể điều phối.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={() => dispatch.mutate()}
              disabled={dispatch.isPending || !technicianId || !treatmentId}
            >
              {dispatch.isPending ? "Đang xử lý..." : "Xác nhận Điều phối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          if (!v) {
            setCreateOpen(false);
            resetCreate();
          } else setCreateOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
            <DialogDescription>
              Dành cho Quản lý/CSKH khi nhận điện thoại đặt lịch.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitCreate} className="space-y-3">
            <div className="flex items-center gap-2 p-1 bg-[#f3f7f3] rounded-lg border border-hairline">
              <button
                type="button"
                onClick={() => setIsNewCustomerMode(false)}
                className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition ${
                  !isNewCustomerMode
                    ? "bg-white text-brand-dark shadow"
                    : "text-ink-muted"
                }`}
              >
                Khách hàng cũ
              </button>
              <button
                type="button"
                onClick={() => setIsNewCustomerMode(true)}
                className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition ${
                  isNewCustomerMode
                    ? "bg-white text-brand-dark shadow"
                    : "text-ink-muted"
                }`}
              >
                Khách hàng mới
              </button>
            </div>

            {isNewCustomerMode ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tên khách hàng *</Label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Số điện thoại *</Label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Khách hàng *</Label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc SĐT..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm mb-1.5"
                />
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customersQ.data ?? [])
                      .filter((c) => {
                        const q = customerSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (c.name ?? "").toLowerCase().includes(q) ||
                          (c.phone ?? "").toLowerCase().includes(q)
                        );
                      })
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {(c.name ?? "—") + (c.phone ? ` · ${c.phone}` : "")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Dịch vụ *</Label>
              <Select value={cService} onValueChange={setCService}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {(servicesQ.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.name ?? s.id}>
                      {s.name ?? "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày hẹn *</Label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ hẹn *</Label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreate();
                }}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu lịch hẹn"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">
        {label}
      </div>
      <div className="text-sm font-semibold text-brand-dark mt-0.5 break-words">
        {value}
      </div>
    </div>
  );
}
