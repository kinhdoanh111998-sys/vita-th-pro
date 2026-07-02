import { createFileRoute } from "@tanstack/react-router";
import { Quote, Star } from "lucide-react";

export const Route = createFileRoute("/_public/about/testimonials")({
  component: TestimonialsPage,
  head: () => ({
    meta: [
      { title: "Khách hàng nói về chúng tôi | Vita TH Pro" },
      { name: "description", content: "Cảm nhận thật của khách hàng về liệu trình trị liệu và trải nghiệm dịch vụ tại Vita TH Pro." },
      { property: "og:title", content: "Khách hàng nói về chúng tôi | Vita TH Pro" },
      { property: "og:description", content: "Chia sẻ trải nghiệm chân thật từ khách hàng đã đồng hành cùng Vita TH Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const REVIEWS = [
  { name: "Chị Minh Anh", meta: "34 tuổi · Hà Nội", rating: 5, service: "Liệu trình Laser Pico", initials: "MA", ring: "from-rose-200 to-pink-300",
    text: "5 buổi trị nám bằng Laser Pico tại Vita mờ đến 85% vết nám sâu, da căng bóng khoẻ hơn hẳn. Máy móc hiện đại, tia laser nhẹ nhàng không đau rát." },
  { name: "Anh Hoàng Long", meta: "29 tuổi · TP.HCM", rating: 5, service: "Ultherapy nâng cơ", initials: "HL", ring: "from-sky-200 to-emerald-300",
    text: "Công nghệ Soi da AI phân tích chuẩn xác, bác sĩ lên phác đồ cá nhân hoá cực chi tiết. Chuyên viên thao tác chuẩn tay, không hề bị chèo kéo mua thêm combo." },
  { name: "Chị Thảo Nguyễn", meta: "41 tuổi · Đà Nẵng", rating: 5, service: "Căng chỉ Meso", initials: "TN", ring: "from-amber-200 to-orange-300",
    text: "Tham gia hội thảo trải nghiệm công nghệ căng chỉ Meso mới, được soi da và tư vấn chuyên sâu miễn phí. Không gian spa chuẩn 5 sao, mình đăng ký gói chăm sóc cho cả hai mẹ con." },
  { name: "Chị Bảo Ngọc", meta: "27 tuổi · Hải Phòng", rating: 5, service: "Trị mụn nội tiết", initials: "BN", ring: "from-emerald-200 to-teal-300",
    text: "Da mụn viêm nội tiết của mình cải thiện 70% sau 8 buổi. Bác sĩ theo sát tiến độ qua ứng dụng, dặn dò chế độ ăn và skincare tại nhà rất chi tiết." },
  { name: "Anh Trọng Nghĩa", meta: "36 tuổi · TP.HCM", rating: 5, service: "HydraFacial + Laser", initials: "TN", ring: "from-violet-200 to-fuchsia-300",
    text: "Đàn ông ngại đi spa nhưng ở Vita mình được tư vấn riêng tư, phòng VIP kín đáo. Sau 3 tháng làn da đều màu, lỗ chân lông se khít rõ rệt." },
  { name: "Chị Kim Oanh", meta: "45 tuổi · Cần Thơ", rating: 5, service: "Trẻ hoá RF", initials: "KO", ring: "from-indigo-200 to-sky-300",
    text: "Đã đi rất nhiều spa nhưng Vita TH Pro có quy trình rõ ràng, thiết bị chính hãng, giá minh bạch. Da mình săn chắc thấy rõ sau liệu trình RF." },
];

function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="relative bg-gradient-to-br from-brand-dark via-emerald-900 to-brand-primary text-white py-14 md:py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex text-xs font-black uppercase tracking-[0.25em] bg-white/15 rounded-full px-3 py-1">
            Cảm nhận khách hàng
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">Khách hàng nói về chúng tôi</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">
            Những chia sẻ thật từ khách hàng đã đồng hành cùng Vita TH Pro — cột mốc niềm tin và động lực để chúng tôi tiếp tục hoàn thiện.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <div key={r.name + r.service} className="rounded-2xl border border-hairline bg-white p-6 shadow-sm hover:shadow-lg transition flex flex-col">
              <Quote className="w-8 h-8 text-brand-primary/30" />
              <p className="mt-3 text-sm text-ink leading-relaxed flex-1">"{r.text}"</p>
              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${r.ring} grid place-items-center text-white text-sm font-black`}>
                  {r.initials}
                </div>
                <div>
                  <div className="font-black text-brand-dark text-sm">{r.name}</div>
                  <div className="text-[11px] text-brand-muted">{r.meta} · {r.service}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
