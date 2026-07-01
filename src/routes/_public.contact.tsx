import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Liên hệ – Kết nối với VITA" },
      {
        name: "description",
        content:
          "Để lại thông tin để nhận tư vấn chuyển giao công nghệ và chính sách hợp tác cùng VITA.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedPhone) {
      toast.error("Vui lòng nhập họ tên và số điện thoại.");
      return;
    }
    if (trimmedName.length > 100 || trimmedPhone.length > 20 || trimmedContent.length > 1000) {
      toast.error("Nội dung vượt quá độ dài cho phép.");
      return;
    }

    setLoading(true);
    try {
      const refCode =
        typeof window !== "undefined"
          ? sessionStorage.getItem("vita_affiliate_ref")
          : null;

      const { error } = await supabase.from("contacts").insert({
        name: trimmedName,
        phone: trimmedPhone,
        content: trimmedContent || null,
        affiliate_ref: refCode,
      });

      if (error) throw error;

      toast.success("Gửi thông tin thành công! Chúng tôi sẽ liên hệ sớm.");
      setName("");
      setPhone("");
      setContent("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không gửi được";
      toast.error(`Gửi thất bại: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  const infoItems = [
    { icon: "📞", label: "Hotline", value: "1900 6868" },
    { icon: "✉️", label: "Email", value: "hello@vitath.pro" },
    { icon: "📍", label: "Trụ sở", value: "Tầng 5, VITA Tower, Hà Nội" },
    { icon: "🕘", label: "Giờ làm việc", value: "T2 – CN, 8:00 – 21:00" },
  ];

  return (
    <section className="bg-brand-bg py-16">
      <div className="mx-auto max-w-[1200px] px-5 grid gap-10 lg:grid-cols-2 items-start">
        {/* Cột trái: Thông tin */}
        <div>
          <h1 className="font-heading text-brand-text text-3xl md:text-4xl font-bold">
            Kết Nối Với VITA
          </h1>
          <p className="font-body text-brand-muted mt-4 text-lg leading-relaxed max-w-lg">
            Để lại thông tin để nhận tư vấn chuyển giao công nghệ và chính sách
            hợp tác.
          </p>

          <ul className="mt-8 space-y-4">
            {infoItems.map((it) => (
              <li key={it.label} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-brand-primary-light text-brand-primary grid place-items-center text-xl shrink-0">
                  {it.icon}
                </div>
                <div>
                  <div className="font-body text-sm text-brand-muted">
                    {it.label}
                  </div>
                  <div className="font-body text-brand-text font-semibold">
                    {it.value}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột phải: Form */}
        <div className="bg-brand-surface p-6 md:p-8 rounded-card border border-brand-border shadow-sm">
          <h2 className="font-heading text-brand-text text-xl font-semibold mb-1">
            Gửi yêu cầu tư vấn
          </h2>
          <p className="font-body text-brand-muted text-sm mb-5">
            Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
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
                className="w-full h-[44px] px-4 rounded-input border border-brand-border bg-white text-brand-text font-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition"
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
                className="w-full h-[44px] px-4 rounded-input border border-brand-border bg-white text-brand-text font-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition"
                placeholder="09xx xxx xxx"
              />
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-brand-text mb-1.5">
                Nội dung cần tư vấn
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                rows={4}
                className="w-full min-h-[100px] px-4 py-3 rounded-input border border-brand-border bg-white text-brand-text font-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light transition resize-y"
                placeholder="Mô tả nhu cầu của bạn..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] rounded-btn bg-brand-primary text-white font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Đang gửi..." : "Gửi thông tin"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
