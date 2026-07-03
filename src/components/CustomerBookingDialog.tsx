import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { nextInLineTreatments } from "@/lib/nextInLineTreatments";
import { notifyOpsNewBooking } from "@/lib/booking-notify.functions";

type Mode = "existing" | "new";

type Customer = { id: string; name: string | null; phone: string | null; email: string | null } | null;

/**
 * Dialog để khách hàng đã đăng nhập tự đặt lịch trực tiếp trong /app/account.
 * - Mode "existing": chỉ hiển thị buổi next-in-line (session_number nhỏ nhất
 *   status='pending') của mỗi thẻ liệu trình. Ẩn hoàn toàn buổi phía sau.
 * - Mode "new": chỉ hiển thị Services (loại trừ Products).
 * Sau khi lưu → notifyOpsNewBooking để bắn thông báo cho admin/manager.
 */
export function CustomerBookingDialog({ customer }: { customer: Customer }) {
  const { email, fullName } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("existing");
  const [treatmentId, setTreatmentId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [storeId, setStoreId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const customerId = customer?.id ?? null;
  const customerName = customer?.name ?? fullName ?? email ?? "Khách hàng";
  const customerPhone = customer?.phone ?? "";

  // Chỉ services (loại products)
  const servicesQ = useQuery({
    queryKey: ["customer-booking-services"],
    enabled: open && mode === "new",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, type, is_hidden")
        .neq("type", "product")
        .order("name");
      if (error) throw error;
      return (data ?? []).filter((s: { is_hidden?: boolean | null }) => !s.is_hidden) as {
        id: string; name: string; type: string | null;
      }[];
    },
  });

  const storesQ = useQuery({
    queryKey: ["customer-booking-stores"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, address, is_active")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string; address: string | null }[];
    },
  });

  const treatmentsQ = useQuery({
    queryKey: ["customer-booking-treatments", customerId],
    enabled: open && mode === "existing" && !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, order_id, customer_id, session_number, status, service_id")
        .eq("customer_id", customerId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const treatmentServiceIds = useMemo(
    () => Array.from(new Set(((treatmentsQ.data ?? []) as { service_id: string | null }[])
      .map((t) => t.service_id).filter(Boolean) as string[])),
    [treatmentsQ.data],
  );
  const serviceNamesQ = useQuery({
    queryKey: ["customer-booking-svc-names", treatmentServiceIds.join(",")],
    enabled: treatmentServiceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services").select("id, name").in("id", treatmentServiceIds);
      if (error) throw error;
      return new Map((data ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));
    },
  });

  const nextInLine = useMemo(() => {
    return nextInLineTreatments(
      (treatmentsQ.data ?? []) as {
        id: string; order_id: string; session_number: number; status: string; service_id: string | null;
      }[],
      customerId,
    );
  }, [treatmentsQ.data, customerId]);

  function reset() {
    setMode("existing");
    setTreatmentId("");
    setServiceId("");
    setStoreId("");
    setDate("");
    setTime("");
    setNote("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Không tìm thấy hồ sơ khách hàng. Vui lòng cập nhật hồ sơ trước.");
      return;
    }
    if (!date || !time) {
      toast.error("Vui lòng chọn ngày và giờ hẹn");
      return;
    }
    if (!storeId) {
      toast.error("Vui lòng chọn cơ sở");
      return;
    }

    let chosenServiceId: string | null = null;
    let chosenServiceName: string | null = null;
    let extraNote = "";

    if (mode === "existing") {
      if (!treatmentId) { toast.error("Vui lòng chọn buổi liệu trình"); return; }
      const t = nextInLine.find((x) => x.id === treatmentId);
      if (!t) { toast.error("Buổi liệu trình không hợp lệ"); return; }
      chosenServiceId = t.service_id;
      chosenServiceName = t.service_id
        ? serviceNamesQ.data?.get(t.service_id) ?? "Liệu trình"
        : "Liệu trình";
      extraNote = `[Liệu trình có sẵn] Buổi #${t.session_number} • treatment_id=${t.id}`;
    } else {
      if (!serviceId) { toast.error("Vui lòng chọn dịch vụ"); return; }
      const svc = (servicesQ.data ?? []).find((s) => s.id === serviceId);
      if (!svc) { toast.error("Dịch vụ không hợp lệ"); return; }
      chosenServiceId = svc.id;
      chosenServiceName = svc.name;
      extraNote = "[Đăng ký dịch vụ mới]";
    }

    const store = (storesQ.data ?? []).find((s) => s.id === storeId);
    const fullNote = [
      extraNote,
      store ? `Cơ sở: ${store.name}` : null,
      note?.trim() || null,
    ].filter(Boolean).join(" | ");

    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: customerId,
          customer_name: customerName,
          phone: customerPhone || "N/A",
          service_id: chosenServiceId,
          service: chosenServiceName,
          booking_date: date,
          booking_time: time,
          booking_at: new Date(`${date}T${time}:00`).toISOString(),
          note: fullNote,
          notes: fullNote,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;

      try {
        await notifyOpsNewBooking({
          data: {
            bookingId: inserted!.id as string,
            customerName,
            service: chosenServiceName,
            when: `${date} ${time}`,
          },
        });
      } catch (nerr) {
        console.warn("[booking] notify ops failed:", nerr);
      }

      toast.success("Đã gửi yêu cầu đặt lịch. Chúng tôi sẽ xác nhận sớm nhất!");
      reset();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Đặt lịch thất bại: " + msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-brand hover:bg-brand-dark text-white font-bold rounded-full h-11 px-5">
          <CalendarCheck className="w-4 h-4" /> Đặt lịch ngay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt lịch hẹn</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Loại đặt lịch</Label>
            <Select value={mode} onValueChange={(v) => { setMode(v as Mode); setTreatmentId(""); setServiceId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">Sử dụng liệu trình có sẵn</SelectItem>
                <SelectItem value="new">Đăng ký dịch vụ mới</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "existing" && (
            <div className="space-y-1.5">
              <Label>Buổi liệu trình kế tiếp</Label>
              <Select value={treatmentId} onValueChange={setTreatmentId}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    treatmentsQ.isLoading
                      ? "Đang tải..."
                      : nextInLine.length ? "Chọn liệu trình" : "Không có liệu trình khả dụng"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {nextInLine.map((t) => {
                    const sname = t.service_id ? serviceNamesQ.data?.get(t.service_id) ?? "Liệu trình" : "Liệu trình";
                    return (
                      <SelectItem key={t.id} value={t.id}>
                        {sname} — Buổi #{t.session_number} (còn {t.remaining} buổi)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!treatmentsQ.isLoading && nextInLine.length === 0 && (
                <p className="text-xs text-ink-muted">
                  Bạn chưa có liệu trình khả dụng. Hãy chọn “Đăng ký dịch vụ mới”.
                </p>
              )}
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-1.5">
              <Label>Dịch vụ</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder={servicesQ.isLoading ? "Đang tải..." : "Chọn dịch vụ"} />
                </SelectTrigger>
                <SelectContent>
                  {(servicesQ.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ngày hẹn</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Giờ hẹn</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cơ sở</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder={storesQ.isLoading ? "Đang tải..." : "Chọn chi nhánh"} />
              </SelectTrigger>
              <SelectContent>
                {(storesQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.address ? ` — ${s.address}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú (tuỳ chọn)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi yêu cầu đặt lịch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
