import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "VITA – Hệ Sinh Thái Chăm Sóc Sức Khỏe & Làm Đẹp Toàn Diện" },
      {
        name: "description",
        content:
          "VITA tiên phong chuyển giao công nghệ trị liệu và quản lý chuỗi Spa thông minh. Khám phá thiết bị, đặt lịch dịch vụ và hợp tác mở chuỗi.",
      },
      { property: "og:title", content: "VITA – Hệ Sinh Thái Chăm Sóc Sức Khỏe & Làm Đẹp" },
      {
        property: "og:description",
        content:
          "Tiên phong chuyển giao công nghệ trị liệu và quản lý chuỗi Spa thông minh.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      {/* 1. Hero */}
      <section className="bg-brand-bg">
        <div className="mx-auto max-w-[1200px] px-5 py-20 lg:py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary-light text-brand-primary px-4 py-1.5 text-sm font-semibold">
            Health &amp; Wellness Ecosystem
          </span>
          <h1 className="font-heading text-brand-text text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mt-5 max-w-4xl mx-auto">
            Hệ Sinh Thái Chăm Sóc Sức Khỏe &amp; Làm Đẹp Toàn Diện
          </h1>
          <p className="font-body text-brand-muted text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Tiên phong chuyển giao công nghệ trị liệu và quản lý chuỗi Spa thông minh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-[44px] px-6 rounded-btn bg-brand-primary text-white font-semibold hover:opacity-90 transition"
            >
              Khám phá thiết bị
            </Link>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center h-[44px] px-6 rounded-btn border border-brand-border bg-white text-brand-text font-semibold hover:bg-brand-surface transition"
            >
              Đặt lịch dịch vụ
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Core Values */}
      <section className="bg-brand-surface py-20">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="text-center mb-12">
            <h2 className="font-heading text-brand-primary text-3xl md:text-4xl font-bold">
              Giá trị cốt lõi
            </h2>
            <p className="font-body text-brand-muted mt-3 max-w-2xl mx-auto">
              Ba trụ cột tạo nên sự khác biệt của hệ sinh thái VITA.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Công nghệ tiên tiến",
                desc: "Ứng dụng thiết bị trị liệu thế hệ mới, chuẩn hóa quy trình và mang lại hiệu quả rõ rệt sau từng liệu trình.",
                icon: "⚡",
              },
              {
                title: "Đội ngũ chuyên gia",
                desc: "Chuyên viên được đào tạo bài bản, đồng hành cùng khách hàng và chủ cơ sở trong suốt quá trình vận hành.",
                icon: "👩‍⚕️",
              },
              {
                title: "Hỗ trợ 24/7",
                desc: "Hệ thống chăm sóc, tư vấn kỹ thuật và vận hành luôn sẵn sàng phục vụ mọi thời điểm trong ngày.",
                icon: "💬",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-card border border-brand-border p-7 shadow-sm hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary-light text-brand-primary grid place-items-center text-2xl mb-4">
                  {v.icon}
                </div>
                <h3 className="font-heading text-brand-text text-xl font-semibold">
                  {v.title}
                </h3>
                <p className="font-body text-brand-muted mt-2 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CTA cuối trang */}
      <section className="bg-brand-primary-light">
        <div className="mx-auto max-w-[1200px] px-5 py-20 text-center">
          <h2 className="font-heading text-brand-primary text-3xl md:text-4xl font-bold max-w-3xl mx-auto leading-snug">
            Sẵn sàng mở chuỗi Spa của riêng bạn cùng VITA?
          </h2>
          <p className="font-body text-brand-text mt-4 max-w-2xl mx-auto text-lg">
            Nhận tư vấn chuyển giao công nghệ, mô hình vận hành và giải pháp
            thiết bị trọn gói – đồng hành cùng bạn từ ngày đầu tiên.
          </p>
          <div className="mt-8">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center h-[44px] px-8 rounded-btn bg-brand-primary text-white font-semibold hover:opacity-90 transition"
            >
              Liên hệ hợp tác
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
