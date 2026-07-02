import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Lịch sử phát triển | Vita TH Pro" },
      { name: "description", content: "Hành trình hơn 10 năm kiến tạo hệ sinh thái spa & clinic công nghệ cao của Vita TH Pro." },
      { property: "og:title", content: "Lịch sử phát triển | Vita TH Pro" },
      { property: "og:description", content: "Hành trình hơn 10 năm kiến tạo hệ sinh thái spa & clinic công nghệ cao." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const MILESTONES = [
  { year: "2014", title: "Khởi nguồn Vita TH Pro", desc: "Trung tâm chăm sóc da đầu tiên khai trương tại Hà Nội, đặt nền móng cho triết lý 'chăm sóc từ gốc, trị liệu bằng công nghệ'." },
  { year: "2017", title: "Chuẩn hoá quy trình y khoa", desc: "Ký kết chuyển giao công nghệ với các hãng thiết bị thẩm mỹ hàng đầu Hàn Quốc, Israel; đội ngũ bác sĩ da liễu chuyên trách được thành lập." },
  { year: "2019", title: "Mở rộng chuỗi hệ thống", desc: "Vận hành 5 chi nhánh chính tại Hà Nội, Đà Nẵng, TP.HCM. Ra mắt dòng sản phẩm cosmeceutical độc quyền." },
  { year: "2022", title: "Số hoá trải nghiệm khách hàng", desc: "Triển khai hệ thống quản lý liệu trình bằng mã QR, ứng dụng chăm sóc khách hàng và cổng cộng đồng Vita." },
  { year: "2024", title: "Vươn tầm khu vực", desc: "Chuyển giao công nghệ và nhượng quyền cho hơn 30 đối tác spa/clinic trên cả nước, phát triển AI Soi Da thế hệ mới." },
  { year: "2026", title: "Vita TH Pro hôm nay", desc: "Hệ sinh thái sức khoẻ – sắc đẹp toàn diện: clinic, cửa hàng, đào tạo, cộng đồng, ứng dụng khách hàng và mạng lưới đại lý." },
];

function HistoryPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="relative bg-gradient-to-br from-brand-dark via-emerald-900 to-brand-primary text-white py-14 md:py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex text-xs font-black uppercase tracking-[0.25em] bg-white/15 rounded-full px-3 py-1">
            Về Vita TH Pro
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">
            Lịch sử phát triển
          </h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">
            Hơn một thập kỷ theo đuổi triết lý chăm sóc chuyên sâu, kết hợp công nghệ y khoa và trải nghiệm dịch vụ chuẩn 5 sao.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-primary/60 via-brand-primary to-transparent md:-translate-x-1/2" />
          <div className="space-y-10">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className={`relative md:grid md:grid-cols-2 md:gap-10 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:col-start-2" : ""}`}>
                <div className={`pl-12 md:pl-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-brand-primary bg-brand-soft rounded-full px-3 py-1">
                      {m.year}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-brand-dark">{m.title}</h3>
                  <p className="mt-2 text-sm text-brand-muted leading-relaxed">{m.desc}</p>
                </div>
                <div className={`hidden md:block ${i % 2 === 0 ? "md:pl-12" : "md:pr-12 md:text-right"}`}>
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-amber-50 border border-hairline shadow-sm grid place-items-center">
                    <span className="text-6xl font-black text-brand-primary/30">{m.year}</span>
                  </div>
                </div>
                <span className="absolute left-4 md:left-1/2 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-primary border-4 border-white shadow" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
