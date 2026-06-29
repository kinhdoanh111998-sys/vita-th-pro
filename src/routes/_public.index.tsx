import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { ProductCard } from "@/components/ProductCard";
import { banners, catalog, posts } from "@/lib/mockData";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Vita TH Pro – Website chăm sóc sức khỏe & chuyển giao công nghệ" },
      {
        name: "description",
        content:
          "Vita TH Pro: máy công nghệ chăm sóc sức khỏe, đặt lịch trải nghiệm, quản lý liệu trình và chuyển giao công nghệ cho chủ cơ sở.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const hero = banners[0];
  const featured = catalog.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(73,169,66,0.22),transparent_32%),linear-gradient(135deg,#fff_0%,#f0fbef_48%,#fff_100%)]">
        <div className="mx-auto max-w-[1180px] px-5 py-12 lg:py-14 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] items-center min-h-[610px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft text-brand-dark border border-brand-mint px-3 py-2 text-[13px] font-black">
              ★ Cộng đồng sống khỏe – Công nghệ chăm sóc chủ động
            </span>
            <h1 className="text-[44px] lg:text-[52px] font-black leading-[1.05] tracking-tight mt-4 mb-4">
              Vita TH Pro – Chăm sóc sức khỏe bằng công nghệ AI & Terahertz
            </h1>
            <p className="text-lg text-ink-muted max-w-[720px]">
              Đặt lịch trải nghiệm máy công nghệ, quản lý liệu trình, vận hành
              tour dịch vụ và chuyển giao mô hình cho chủ cơ sở – tất cả trong
              một website demo hoàn chỉnh.
            </p>
            <div className="flex gap-3 flex-wrap mt-6">
              <Button>Đặt lịch trải nghiệm</Button>
              <Button variant="secondary">Tra cứu liệu trình</Button>
            </div>
            <div className="flex gap-2.5 flex-wrap mt-5">
              {["Máy công nghệ AI", "Terahertz", "Liệu trình 5 buổi", "Chuyển giao cơ sở"].map(
                (b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1.5 border border-hairline bg-white rounded-full px-3 py-2 text-[#304235] font-extrabold text-[13px]"
                  >
                    ✓ {b}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="bg-white/80 border border-hairline rounded-[32px] shadow-[0_18px_46px_rgba(21,89,42,0.12)] p-4">
            <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-[#f7fff6] to-[#dff5e3]">
              <img
                src={hero.image}
                alt={hero.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3.5">
              <Stat value="2.500+" label="Khách trải nghiệm" />
              <Stat value="12" label="Dòng máy công nghệ" />
              <Stat value="36" label="Cơ sở chuyển giao" />
              <Stat value="98%" label="Khách hài lòng" />
            </div>
          </div>
        </div>
      </section>

      {/* Event strip */}
      <div className="bg-brand-deep text-white">
        <div className="mx-auto max-w-[1180px] px-5 py-2.5 flex items-center justify-between gap-3">
          <strong className="text-sm">🔥 Đang diễn ra:</strong>
          <div className="overflow-hidden whitespace-nowrap font-extrabold flex-1">
            <span className="inline-block animate-[marq_26s_linear_infinite] pl-full">
              {banners.map((b) => b.title).join("   •   ")}
            </span>
          </div>
        </div>
      </div>

      {/* Featured products */}
      <section className="py-16">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="flex items-end justify-between gap-5 mb-6 flex-wrap">
            <div>
              <h2 className="text-3xl lg:text-[34px] font-black tracking-tight">
                Sản phẩm & dịch vụ nổi bật
              </h2>
              <p className="text-ink-muted max-w-[620px] mt-2">
                Danh mục máy công nghệ Vita và các gói dịch vụ chăm sóc liệu
                trình được khách lựa chọn nhiều nhất.
              </p>
            </div>
            <Link to="/" className="text-brand-dark font-extrabold text-sm hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="py-16 bg-gradient-to-b from-white to-brand-lime">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="mb-6">
            <h2 className="text-3xl lg:text-[34px] font-black tracking-tight">
              Tin tức & hoạt động
            </h2>
            <p className="text-ink-muted max-w-[620px] mt-2">
              Hoạt động, sự kiện và lịch đào tạo mới nhất từ Vita TH Pro.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className="overflow-hidden rounded-[22px] bg-white border border-hairline shadow-[0_8px_24px_rgba(21,89,42,0.06)]"
              >
                <div className="aspect-[16/10] overflow-hidden border-b border-hairline">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <span className="inline-flex rounded-full bg-brand-soft text-brand-dark px-2.5 py-1 text-xs font-extrabold mb-2">
                    {p.category}
                  </span>
                  <h3 className="text-[17px] font-bold leading-snug">{p.title}</h3>
                  <p className="text-sm text-ink-muted mt-2 line-clamp-3">{p.summary}</p>
                  <small className="block mt-3 text-ink-muted text-xs">{p.date}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="mx-auto max-w-[1180px] px-5">
          <div className="rounded-[26px] border border-brand-mint bg-gradient-to-br from-white to-brand-soft p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black">Sẵn sàng triển khai cơ sở của bạn?</h3>
              <p className="text-ink-muted mt-2 max-w-[560px]">
                Đội ngũ Vita TH Pro hỗ trợ tư vấn máy công nghệ, đào tạo nhân
                viên và bàn giao website quản lý vận hành.
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Button>Liên hệ chuyển giao</Button>
              <Button variant="secondary">Đặt lịch tư vấn</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-hairline rounded-[18px] p-3.5">
      <b className="text-[22px] text-brand-dark">{value}</b>
      <span className="block text-ink-muted text-[13px] font-bold">{label}</span>
    </div>
  );
}
