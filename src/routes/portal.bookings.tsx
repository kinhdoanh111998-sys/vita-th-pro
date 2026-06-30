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
  const [cCustomerId, setCCustomerId] = useState("");
  const [cService, setCService] = useState("");
  const [cDate, setCDate] = useState("");
  const [cTime, setCTime] = useState("");
  const [cNote, setCNote] = useState("");

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
    setCCustomerId("");
    setCService("");
    setCDate("");
    setCTime("");
    setCNote("");
  };

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!cCustomerId) throw new Error("Vui lòng chọn khách hàng.");
      if (!cService) throw new Error("Vui lòng chọn dịch vụ.");
      if (!cDate || !cTime) throw new Error("Vui lòng chọn ngày & giờ hẹn.");
      const cust = customersQ.data?.find((c) => c.id === cCustomerId);
      const { error } = await supabase.from("bookings").insert({
        customer_name: cust?.name ?? null,
        phone: cust?.phone ?? null,
        service: cService,
        booking_date: cDate,
        booking_time: cTime,
        note: cNote || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã tạo lịch hẹn mới.");
      qc.invalidateQueries({ queryKey: ["portal", "bookings"] });
      qc.invalidateQueries({ queryKey: ["portal", "bookings-pending-count"] });
      resetCreate();
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
      <div className="bg-white border border-hairline rounded-2xl p-6">
        <h1 className="text-2xl font-black text-brand-dark">Điều phối Lịch hẹn</h1>
        <p className="text-ink-muted font-medium text-sm mt-1">
          {bookingsQ.isLoading
            ? "Đang tải..."
            : `${rows.length} lịch hẹn đang chờ điều phối (status = pending).`}
        </p>
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
