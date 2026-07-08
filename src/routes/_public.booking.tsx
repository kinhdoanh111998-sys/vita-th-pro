import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { notifyOpsNewBooking } from "@/lib/booking-notify.functions";
import { useAuth } from "@/lib/AuthContext";

// Khai báo kiểu dữ liệu cho tham số trên URL
type BookingSearch = {
  note?: string;
};

export const Route = createFileRoute("/_public/booking")({
  validateSearch: (search: Record<string, unknown>): BookingSearch => {
    return {
      note: typeof search.note === "string" ? search.note : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Đặt lịch hẹn | Vita TH Pro" },
      {
        name: "description",
        content:
          "Đặt lịch hẹn trị liệu tại VITA. Đội ngũ chuyên viên sẽ liên hệ xác nhận lịch hẹn trong ít phút.",
      },
    ],
  }),
  component: BookingPage,
});

const OTHER_VALUE = "__other__";

type ServiceOption = { id: string; name: string };

function BookingPage() {
  const { session } = useAuth(); // Chỉ lấy session để lấy UID cho notify
  // Lấy tham số 'note' từ URL do Trang chủ / Marketing đẩy sang
  const searchParams = useSearch({ from: "/_public/booking" });
  const campaignNote = searchParams.note || "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(""); 
  const [otherService, setOtherService] = useState("");
  const [date, setDate] = useState(""); 
  const [time, setTime] = useState(""); 
  
  // Khởi tạo state note bằng biến campaignNote lấy từ URL (nếu có)
  const [note, setNote] = useState(campaignNote);
  
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);

  // NẾU đi từ nút Marketing, ta tự động set dịch vụ thành "Dịch vụ khác" để tránh lỗi trống trường
  useEffect(() => {
    if (campaignNote) {
      setService(OTHER_VALUE);
      setOtherService(campaignNote);
    }
  }, [campaignNote]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,type,is_hidden")
        .eq("is_hidden", false)
        .eq("type", "service")
        .order("name", { ascending: true });
      if (error) {
        console.warn("[booking] load services failed", error);
        return;
      }
      if (mounted) {
        setServices(
          (data ?? []).map((s) => ({ id: s.id as string, name: s.name as string })),
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isOther = service === OTHER_VALUE;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedOther = otherService.trim();

    if (!trimmedName || !trimmedPhone || !service || !date || !time) {
      toast.error("Vui lòng điền đầy đủ họ tên, SĐT, dịch vụ và thời gian hẹn.");
      return;
    }
    if (isOther && !trimmedOther) {
      toast.error("Vui lòng nhập dịch vụ hoặc yêu cầu cụ thể của bạn.");
      return;
    }
    if (
      trimmedName.length > 100 ||
      trimmedPhone.length > 20 ||
      note.length > 1000 ||
      trimmedOther.length > 500
    ) {
      toast.error("Nội dung vượt quá độ dài cho phép.");
      return;
    }

    setLoading(true);
    try {
      const refCode =
        typeof window !== "undefined"
          ? sessionStorage.getItem("vita_affiliate_ref")
          : null;
      const numericRef = refCode && /^\d+$/.test(refCode) ? refCode : null;

      // Ghép ngày và giờ lại để lưu
      const appointmentDate = new Date(`${date}T${time}:00`);
      const bookingDate = date;
      const bookingTime = time;

      let customerId: string | null = null;
      
      // FIX LỖI 2: Chỉ lấy ID của khách hàng có Số Điện Thoại khớp với SĐT vừa nhập trên form. 
      if (trimmedPhone) {
        const { data: cust } = await supabase
          .from("customers").select("id").eq("phone", trimmedPhone).maybeSingle();
        customerId = cust?.id ?? null;
      }

      const selectedService = services.find((s) => s.id === service);
      const serviceLabel = isOther
        ? `Dịch vụ khác: ${trimmedOther}`
        : selectedService?.name ?? "";

      const mergedNote = [
        isOther ? `Dịch vụ khác yêu cầu: ${trimmedOther}` : null,
        note.trim() || null,
      ]
        .filter(Boolean)
        .join("\n") || null;

      const newBookingId = crypto.randomUUID(); 

      const { error } = await supabase.from("bookings").insert({
        id: newBookingId,
        customer_id: customerId,
        customer_name: trimmedName,
        phone: trimmedPhone,
        service: serviceLabel,
        service_id: isOther ? null : selectedService?.id ?? null,
        booking_date: bookingDate,
        booking_time: bookingTime,
        booking_at: appointmentDate.toISOString(),
        note: mergedNote,
        notes: mergedNote,
        status: "pending",
        affiliate_ref: refCode,
        referrer_phone: numericRef,
      });

      if (error) throw new Error(error.message);

      try {
        const uid = session?.user?.id ?? null;
        await notifyOpsNewBooking({ data: {
          bookingId: newBookingId,
          customerName: trimmedName,
          service: serviceLabel,
          when: appointmentDate.toLocaleString("vi-VN"),
          customerUserId: uid,
        }});
      } catch (nErr) {
        console.warn("[booking] notify ops failed", nErr);
      }

      toast.success("Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận sớm.", { duration: 5000 });
      setName("");
      setPhone("");
      // Không reset 2 trường này nếu là form từ chiến dịch
      if (!campaignNote) {
        setService("");
        setOtherService("");
        setNote("");
      }
      setDate("");
      setTime("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không gửi được";
      toast.error(`Đặt lịch thất bại: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full h-[44px] px-4 rounded-input border border-brand-border bg-white text-brand-text font-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition";

  return (
    <section className="bg-brand-bg py-16">
      <div className="mx-auto max-w-[1200px] px-5 grid gap-10 lg:grid-cols-2 items-start">
        <div className="lg:order-2">
          <h1 className="font-heading text-brand-text text-3xl md:text-4xl font-bold">
            {campaignNote ? "Đăng Ký " + campaignNote : "Đặt Lịch Hẹn Trị Liệu"}
          </h1>
          <p className="font-body text-brand-muted mt-4 text-lg leading-relaxed max-w-lg">
            {campaignNote 
              ? "Bạn đang đăng ký tham gia chương trình ưu đãi đặc biệt. Vui lòng để lại thông tin để chúng tôi liên hệ xác nhận."
              : "Không gian tĩnh tâm, đội ngũ chuyên viên tận tâm. Hãy để VITA đồng hành cùng hành trình chăm sóc sức khỏe và vẻ đẹp của bạn."
            }
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80"
              alt="Không gian spa"
              loading="lazy"
              className="w-full h-48 object-cover rounded-card border border-brand-border"
            />
            <img
              src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80"
              alt="Trị liệu chuyên sâu"
              loading="lazy"
              className="w-full h-48 object-cover rounded-card border border-brand-border mt-6"
            />
          </div>

          <ul className="mt-8 space-y-3 font-body text-brand-text">
            <li className="flex items-start gap-3">
              <span className="text-brand-primary">✓</span>
              Xác nhận lịch hẹn trong vòng 15 phút.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-primary">✓</span>
              Tư vấn lộ trình cá nhân hóa miễn phí.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-primary">✓</span>
              Chuyên viên tận tâm, không gian riêng tư.
            </li>
          </ul>
        </div>

        <div className="lg:order-1 bg-brand-surface p-6 md:p-8 rounded-card border border-brand-border shadow-sm">
          <h2 className="font-heading text-brand-text text-xl font-semibold mb-1">
            Thông tin đặt lịch
          </h2>
          <p className="font-body text-brand-muted text-sm mb-5">
            Vui lòng điền đầy đủ để chúng tôi phục vụ bạn tốt nhất.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                Họ và tên <span className="text-status-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className={inputCls}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                Số điện thoại <span className="text-status-error">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                required
                className={inputCls}
                placeholder="09xx xxx xxx"
              />
            </div>

            {/* Nếu đang là luồng Đăng ký chiến dịch (Có tham số note trên URL) thì ta ẨN cái chọn Dịch vụ đi cho mượt */}
            {!campaignNote && (
              <div>
                <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                  Dịch vụ quan tâm <span className="text-status-error">*</span>
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value={OTHER_VALUE}>Dịch vụ khác</option>
                </select>

                {isOther && (
                  <input
                    type="text"
                    value={otherService}
                    onChange={(e) => setOtherService(e.target.value)}
                    maxLength={500}
                    required
                    className={`${inputCls} mt-3`}
                    placeholder="Vui lòng nhập dịch vụ hoặc yêu cầu cụ thể của bạn..."
                  />
                )}
              </div>
            )}

            {/* FIX LỖI 1: Tách ô Ngày và Giờ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                  Ngày hẹn <span className="text-status-error">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                  Giờ hẹn <span className="text-status-error">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                Ghi chú thêm
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={4}
                disabled={!!campaignNote} // Khóa ô ghi chú nếu đi từ chiến dịch để khách ko xóa mất chữ
                className="w-full min-h-[100px] px-4 py-3 rounded-input border border-brand-border bg-white text-brand-text font-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition resize-y disabled:bg-gray-50 disabled:text-emerald-700 disabled:font-semibold"
                placeholder="Mong muốn thêm về lịch hẹn..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] rounded-btn bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
            >
              {loading ? "Đang gửi..." : "Đăng ký ngay"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
