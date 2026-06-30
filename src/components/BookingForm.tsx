import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";

type Service = { id: string; name: string };

export function BookingForm({ compact = false }: { compact?: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("catalog")
      .select("id,name")
      .eq("status", "Hiển thị")
      .then(({ data }) => setServices((data as Service[]) ?? []));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!customerName || !phone || !service || !date || !time) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      customer_name: customerName,
      phone,
      service,
      booking_date: date,
      booking_time: time,
      note: note || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Đặt lịch thất bại: " + error.message);
      return;
    }
    toast.success("Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm.");
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
