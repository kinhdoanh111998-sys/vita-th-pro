import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import { notifyOpsNewBooking } from "@/lib/booking-notify.functions";
import { useAuth } from "@/lib/AuthContext";

type Service = { id: string; name: string };

const REF_STORAGE_KEY = "vitath_ref_phone";

export function BookingForm({ compact = false }: { compact?: boolean }) {
  const { email } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refPhone, setRefPhone] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("catalog")
      .select("id,name")
      .eq("status", "Hiển thị")
      .then(({ data }) => setServices((data as Service[]) ?? []));
  }, []);

  // Capture ?ref=... from URL and persist to sessionStorage so it survives reloads.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        sessionStorage.setItem(REF_STORAGE_KEY, ref);
        setRefPhone(ref);
      } else {
        const stored = sessionStorage.getItem(REF_STORAGE_KEY);
        if (stored) setRefPhone(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!customerName || !phone || !service || !date || !time) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setSubmitting(true);
    const referrer =
      refPhone ??
      (typeof window !== "undefined" ? sessionStorage.getItem(REF_STORAGE_KEY) : null);
    let customerId: string | null = null;
    if (email) {
      const { data: cust } = await supabase
        .from("customers").select("id").eq("email", email).maybeSingle();
      customerId = cust?.id ?? null;
    }

    const { data: booking, error } = await supabase.from("bookings").insert({
      customer_id: customerId,
      customer_name: customerName,
      phone,
      service,
      booking_date: date,
      booking_time: time,
      booking_at: `${date}T${time}:00`,
      note: note || null,
      notes: note || null,
      status: "pending",
      referrer_phone: referrer || null,
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error("Đặt lịch thất bại: " + error.message);
      return;
    }

    // Thông báo admin + manager có khách đặt lịch mới
    try {
      await notifyOpsNewBooking({ data: {
        bookingId: booking.id,
        customerName,
        service,
        when: `${date} ${time}`,
      }});
    } catch (nErr) {
      console.warn("[BookingForm] notify ops failed", nErr);
    }

    toast.success("Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm.");
    try {
      sessionStorage.removeItem(REF_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setRefPhone(null);
    setCustomerName("");
    setPhone("");
    setService("");
    setDate("");
    setTime("");
    setNote("");
  }

  const inputCls =
    "w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand";

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "grid gap-3"
          : "grid gap-3 bg-white/90 border border-hairline rounded-[26px] p-6 shadow-[0_18px_46px_rgba(21,89,42,0.10)]"
      }
    >
      {!compact && (
        <div className="mb-1">
          <h3 className="text-2xl font-black text-brand-dark">Đặt lịch trải nghiệm</h3>
          <p className="text-sm text-ink-muted">
            Để lại thông tin, đội ngũ Vita TH Pro sẽ liên hệ xác nhận trong ít phút.
          </p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-[13px] font-bold text-ink">
          Họ tên *
          <input
            className={inputCls}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </label>
        <label className="grid gap-1.5 text-[13px] font-bold text-ink">
          Số điện thoại *
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxx"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-[13px] font-bold text-ink">
        Dịch vụ quan tâm *
        <select
          className={inputCls}
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          <option value="">-- Chọn dịch vụ --</option>
          {services.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-[13px] font-bold text-ink">
          Ngày hẹn *
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="grid gap-1.5 text-[13px] font-bold text-ink">
          Giờ hẹn *
          <input
            type="time"
            className={inputCls}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-[13px] font-bold text-ink">
        Ghi chú
        <textarea
          rows={3}
          className={inputCls}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Mong muốn thêm..."
        />
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Đang gửi..." : "Đặt lịch ngay"}
      </Button>
    </form>
  );
}
