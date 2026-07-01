import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  LogIn,
  Sparkles,
  Store,
  CalendarDays,
  QrCode,
  Wallet,
  Gift,
  Home as HomeIcon,
  User,
  ChevronRight,
  Menu,
  X,
  Star,
  Quote,
} from "lucide-react";
import { AffiliateStoreCard } from "@/components/app/AffiliateStoreCard";
import { FeaturedEventCard } from "@/components/FeaturedEventCard";
import { NewsCard } from "@/components/NewsCard";
import { mockEvents, mockNews } from "@/lib/mockPosts";
import { useSettings } from "@/lib/useSettings";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/vita-th-pro-logo.png";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  cta: string | null;
  image: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const MOCK_STORES = [
  { id: 1, name: "VITA Clinic Quận 1", address: "123 Nguyễn Huệ, Bến Nghé, Q.1", image: "https://placehold.co/400x250/png", rating: "4.9", distance: "1.2 km" },
  { id: 2, name: "VITA Spa Center HN", address: "456 Thái Hà, Đống Đa, Hà Nội", image: "https://placehold.co/400x250/png", rating: "4.8", distance: "3.5 km" },
  { id: 3, name: "VITA Wellness Đà Nẵng", address: "789 Nguyễn Văn Linh, Đà Nẵng", image: "https://placehold.co/400x250/png", rating: "5.0", distance: "5.0 km" },
];



export const Route = createFileRoute("/_public/")({
  component: CommunityHome,
});

type Shortcut = {
  icon: typeof Sparkles;
  label: string;
  color: string;
  to?: string;
  action?: "soi-da-ai";
};

const SHORTCUTS: Shortcut[] = [
  { icon: Sparkles, label: "Soi da AI", color: "bg-pink-100 text-pink-600", action: "soi-da-ai" },
  { icon: Store, label: "Cửa hàng", color: "bg-emerald-100 text-emerald-600", to: "/products" },
  { icon: CalendarDays, label: "Đặt lịch", color: "bg-amber-100 text-amber-600", to: "/booking" },
  { icon: QrCode, label: "Quét QR", color: "bg-sky-100 text-sky-600", to: "/app/scan" },
  { icon: Wallet, label: "Ví VITA", color: "bg-violet-100 text-violet-600", to: "/wallet" },
  { icon: Gift, label: "Ưu đãi", color: "bg-rose-100 text-rose-600", to: "/wallet" },
];


type Testimonial = {
  id: number;
  name: string;
  meta: string;
  rating: number;
  content: string;
  initial: string;
  ring: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Chị Minh Anh",
    meta: "34 tuổi · Hà Nội",
    rating: 5,
    content:
      "Vừa kết thúc liệu trình 5 buổi trị nám bằng công nghệ Laser Pico tại VITA. Vết tàn nhang và chân nám sâu mờ đến 85%, nền da căng bóng và khoẻ hơn rõ rệt. Hệ thống máy móc ở đây cực kỳ hiện đại, lúc đi tia laser nhẹ nhàng không hề đau rát hay bong tróc như các bên khác!",
    initial: "MA",
    ring: "from-rose-200 to-pink-300",
  },
  {
    id: 2,
    name: "Anh Hoàng Long",
    meta: "29 tuổi · TP.HCM",
    rating: 5,
    content:
      "Rất ấn tượng với công nghệ soi da AI tại VITA, phân tích chuẩn xác từng phân vùng sắc tố ẩn sâu dưới da. Mình được bác sĩ lên phác đồ nâng cơ trẻ hoá bằng Ultherapy cá nhân hoá, chuyên viên thao tác rất chuẩn tay, không hề có tình trạng chèo kéo mua thêm combo.",
    initial: "HL",
    ring: "from-sky-200 to-emerald-300",
  },
  {
    id: 3,
    name: "Chị Thảo Nguyễn",
    meta: "41 tuổi · Đà Nẵng",
    rating: 5,
    content:
      "Tham gia buổi hội thảo trải nghiệm công nghệ căng chỉ Meso mới của viện tuần trước, mình được soi da và tư vấn chuyên sâu miễn phí. Không gian spa chuẩn 5 sao, tinh dầu thư giãn. Mình đã đăng ký luôn một gói chăm sóc chuyên sâu cho cả hai mẹ con vào tháng tới.",
    initial: "TN",
    ring: "from-amber-200 to-orange-300",
  },
];



function CommunityHome() {
  const { data: settings } = useSettings();
  const brand = settings?.brand ?? "Vita TH Pro";
  const hotline = settings?.hotline ?? "0988 000 888";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [skinAIOpen, setSkinAIOpen] = useState(false);

  const navLinks: Array<{ label: string; to: string }> = [
    { label: "Trang chủ", to: "/" },
    { label: "Giới thiệu", to: "/about" },
    { label: "Sản phẩm", to: "/products" },
    { label: "Dịch vụ", to: "/services" },
    { label: "Sự kiện", to: "/events" },
    { label: "Cộng đồng", to: "/community" },
    { label: "Tin tức", to: "/news" },
    { label: "Liên hệ", to: "/contact" },
  ];

  return (
    <div className="mx-auto w-full max-w-[480px] md:max-w-none min-h-screen bg-[#FAFAFA] pb-24 md:pb-12">
      {/* Header — Figma standard */}
      <header
        className="sticky top-0 z-40 bg-white border-b"
        style={{ borderColor: "#E3E3E3" }}
      >
        <div className="w-full flex items-center gap-3 px-4 md:px-12 py-2.5 md:py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logo}
              alt={brand}
              className="h-11 md:h-12 w-auto object-contain"
            />
            <div className="hidden md:flex flex-col leading-tight">
              <span
                className="font-heading font-black text-[15px]"
                style={{ color: "#147805" }}
              >
                {brand}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: "#929292" }}
              >
                Hotline: {hotline}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4 xl:ml-6">
            {navLinks.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-2.5 py-2 rounded-lg text-[13.5px] font-semibold whitespace-nowrap transition-colors hover:bg-[#D9F0D6] hover:text-[#147805]"
                style={{ color: "#484848" }}
                activeProps={{
                  style: { color: "#1B9606", backgroundColor: "#D9F0D6" },
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Desktop-only action buttons */}
            <Link
              to="/lookup"
              className="hidden xl:inline-flex items-center h-10 px-3 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-[#D9F0D6] hover:text-[#147805] hover:border-[#1B9606]"
              style={{ borderColor: "#E3E3E3", color: "#484848" }}
            >
              Tra cứu liệu trình
            </Link>
            <Link
              to="/booking"
              className="hidden md:inline-flex items-center h-10 px-3 lg:px-4 rounded-lg text-[13px] font-semibold text-white transition-colors"
              style={{ backgroundColor: "#1B9606" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#147805")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#1B9606")
              }
            >
              Đặt lịch
            </Link>
            <Link
              to="/dang-ky"
              className="hidden xl:inline-flex items-center h-10 px-3 rounded-lg text-[13px] font-semibold transition-colors hover:text-[#147805]"
              style={{ color: "#484848" }}
            >
              Đăng ký
            </Link>

            {/* Login — visible on all sizes */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 h-10 px-3 md:px-4 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-[#D9F0D6] hover:border-[#1B9606] hover:text-[#147805]"
              style={{ borderColor: "#1B9606", color: "#1B9606" }}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border"
              style={{ borderColor: "#E3E3E3", color: "#484848" }}
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-[82%] max-w-[320px] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#E3E3E3" }}
            >
              <img src={logo} alt={brand} className="h-9 w-auto" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-9 w-9 rounded-lg inline-flex items-center justify-center"
                style={{ color: "#484848" }}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div
                className="flex items-center gap-2 bg-[#FAFAFA] rounded-lg px-3 py-2 border"
                style={{ borderColor: "#E3E3E3" }}
              >
                <Search className="w-4 h-4" style={{ color: "#929292" }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#484848" }}
                />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-2">
              {navLinks.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setDrawerOpen(false)}
                  className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                  style={{ color: "#484848" }}
                  activeProps={{
                    style: { color: "#1B9606", backgroundColor: "#D9F0D6" },
                  }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
              <div className="h-px my-2" style={{ backgroundColor: "#E3E3E3" }} />
              <Link
                to="/lookup"
                onClick={() => setDrawerOpen(false)}
                className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                style={{ color: "#484848" }}
              >
                Tra cứu liệu trình
              </Link>
              <Link
                to="/booking"
                onClick={() => setDrawerOpen(false)}
                className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                style={{ color: "#484848" }}
              >
                Đặt lịch
              </Link>
              <Link
                to="/dang-ky"
                onClick={() => setDrawerOpen(false)}
                className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                style={{ color: "#484848" }}
              >
                Đăng ký
              </Link>
            </nav>

            <div
              className="px-4 py-3 border-t"
              style={{ borderColor: "#E3E3E3" }}
            >
              <Link
                to="/booking"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center h-11 rounded-lg text-white text-[14px] font-semibold"
                style={{ backgroundColor: "#1B9606" }}
              >
                Đặt lịch ngay
              </Link>
            </div>
          </aside>
        </div>
      )}




      {/* Hero Banner Carousel */}
      <HeroCarousel />


      {/* Shortcuts */}
      <section className="px-4 md:px-8 pt-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {SHORTCUTS.map((s) => {
            const inner = (
              <>
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${s.color} group-active:scale-95 transition`}
                >
                  <s.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span className="text-[11px] md:text-sm text-gray-700 text-center leading-tight">
                  {s.label}
                </span>
              </>
            );
            if (s.action === "soi-da-ai") {
              return (
                <button
                  key={s.label}
                  onClick={() => setSkinAIOpen(true)}
                  className="flex flex-col items-center gap-1.5 md:gap-2 group"
                >
                  {inner}
                </button>
              );
            }
            return (
              <Link
                key={s.label}
                to={s.to!}
                className="flex flex-col items-center gap-1.5 md:gap-2 group"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>



      {/* Affiliate Stores */}
      <section id="stores" className="pt-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3 px-4 md:px-8">
          <h2 className="text-base md:text-2xl font-heading font-bold text-gray-900">
            Cửa hàng liên kết
          </h2>
          <button className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible no-scrollbar snap-x md:snap-none snap-mandatory px-4 md:px-8 pb-2">
          {MOCK_STORES.map((s) => (
            <AffiliateStoreCard key={s.id} store={s} />
          ))}
        </div>
      </section>

      {/* Featured Events – upgraded */}
      <section id="events" className="pt-8 md:pt-12 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-4 px-4 md:px-8">
          <div>
            <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-amber-600">
              Đừng bỏ lỡ
            </p>
            <h2 className="text-lg md:text-2xl font-heading font-bold text-gray-900 mt-0.5">
              Sự kiện nổi bật
            </h2>
          </div>
          <Link
            to="/events"
            className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5 font-semibold"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible no-scrollbar snap-x md:snap-none snap-mandatory px-4 md:px-8 pb-2">
          {mockEvents.map((e) => (
            <div
              key={e.id}
              className="shrink-0 w-[85%] sm:w-[60%] md:w-auto snap-start"
            >
              <FeaturedEventCard post={e} />
            </div>
          ))}
        </div>
      </section>

      {/* Kiến thức & Tin tức VITA */}
      <section id="news" className="pt-10 md:pt-14 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-5 px-4 md:px-8">
          <div>
            <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Blog VITA
            </p>
            <h2 className="text-lg md:text-2xl font-heading font-bold text-gray-900 mt-0.5">
              Kiến thức & Tin tức VITA
            </h2>
          </div>
          <Link
            to="/news"
            className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5 font-semibold"
          >
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-8">
          {mockNews.map((n) => (
            <NewsCard key={n.id} post={n} />
          ))}
        </div>
      </section>

      {/* Community Feed + Sidebar */}
      <section id="feed" className="pt-6 max-w-7xl mx-auto w-full px-4 md:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-2xl font-heading font-bold text-gray-900">
            Hoạt động cộng đồng
          </h2>
          <button className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="md:grid md:grid-cols-12 md:gap-6">
          <div className="md:col-span-8 grid gap-5 md:grid-cols-1">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>

          <aside className="hidden md:block md:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-heading font-bold text-gray-900 mb-2">
                Về VITA THPro
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cộng đồng sống khỏe, gắn kết và phát triển bền vững. Hơn 48.500 thành viên tích cực trên cả nước.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-heading font-bold text-gray-900 mb-3">
                Con số nổi bật
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-bold text-emerald-600">48.5K+</p>
                  <p className="text-[11px] text-gray-500">Thành viên</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-500">1.200+</p>
                  <p className="text-[11px] text-gray-500">Cửa hàng</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-sky-500">380+</p>
                  <p className="text-[11px] text-gray-500">Sự kiện</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-rose-500">95%</p>
                  <p className="text-[11px] text-gray-500">Hài lòng</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>



      {/* Public Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-3 h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-1 text-emerald-600"
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[11px] font-medium">Trang chủ</span>
          </Link>
          <Link
            to="/products"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <Store className="w-5 h-5" />
            <span className="text-[11px] font-medium">Cửa hàng</span>
          </Link>
          <Link
            to="/login"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">Đăng nhập</span>
          </Link>
        </div>
      </nav>

      {/* Soi da AI Modal */}
      {skinAIOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
            <div className="relative bg-gradient-to-br from-pink-500 to-rose-500 text-white p-6">
              <button
                onClick={() => setSkinAIOpen(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
              <Sparkles className="w-10 h-10 mb-3" />
              <h3 className="text-xl font-black">Soi Da AI cá nhân hoá</h3>
              <p className="text-sm text-white/90 mt-1">
                Phân tích chi tiết 8 chỉ số da bằng công nghệ AI. Nhận phác đồ điều trị chuyên sâu miễn phí từ bác sĩ VITA.
              </p>
            </div>
            <div className="p-6 space-y-3">
              <ul className="space-y-2 text-sm text-gray-700">
                {[
                  "Phát hiện nám – tàn nhang – sắc tố ẩn dưới da",
                  "Đo độ ẩm, độ đàn hồi, dầu và lỗ chân lông",
                  "Bác sĩ tư vấn liệu trình cá nhân hoá",
                ].map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
              <Link
                to="/booking"
                search={{ service: "soi-da-ai" } as never}
                onClick={() => setSkinAIOpen(false)}
                className="mt-2 flex items-center justify-center h-12 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Đặt lịch Soi Da AI ngay
              </Link>
              <button
                onClick={() => setSkinAIOpen(false)}
                className="w-full h-11 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function HeroCarousel() {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { data: banners = [] } = useQuery({
    queryKey: ["public", "banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
    staleTime: 60_000,
  });

  const list = banners.length > 0
    ? banners
    : [
        {
          id: "placeholder",
          title: "VITA TH Pro",
          subtitle: null,
          cta: null,
          image: null,
          image_url: "https://placehold.co/1600x720/1B9606/ffffff?text=VITA+TH+Pro",
          link_url: null,
          sort_order: 0,
          is_active: true,
        } as Banner,
      ];

  useEffect(() => {
    if (list.length <= 1) return;
    const id = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % list.length;
        const el = scrollerRef.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        return next;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [list.length]);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== active) setActive(idx);
  };

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  return (
    <section className="pt-4 max-w-7xl mx-auto w-full">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {list.map((b) => {
          const src = b.image_url ?? b.image ?? "";
          const inner = (
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] shadow-md bg-gray-100">
              <img src={src} alt={b.title} className="w-full h-full object-cover" />
              {(b.title || b.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-end p-5 md:p-8 text-white">
                  <div className="text-lg md:text-3xl font-black tracking-tight max-w-[70%] drop-shadow-md">
                    {b.title}
                  </div>
                  {b.subtitle && (
                    <div className="text-xs md:text-base mt-1 opacity-90 max-w-[70%] line-clamp-2">
                      {b.subtitle}
                    </div>
                  )}
                  {b.cta && (
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 px-4 h-9 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
                      {b.cta}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
          return (
            <div key={b.id} className="shrink-0 w-full snap-center px-4">
              {b.link_url ? (
                b.link_url.startsWith("http") ? (
                  <a href={b.link_url} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  <Link to={b.link_url}>{inner}</Link>
                )
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>

      {list.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {list.map((b, i) => (
            <button
              key={b.id}
              onClick={() => goTo(i)}
              aria-label={`Chuyển tới banner ${i + 1}`}
              className={
                i === active
                  ? "h-1.5 w-6 rounded-full bg-amber-500 transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-gray-300 transition-all"
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 md:p-7">
      <Quote className="absolute top-5 right-5 w-8 h-8 text-emerald-100" />
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.ring} flex items-center justify-center text-white font-black text-sm shadow-sm`}
        >
          {t.initial}
        </div>
        <div>
          <div className="font-heading font-bold text-gray-900">{t.name}</div>
          <div className="text-xs text-gray-500">{t.meta}</div>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: t.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-[15px] leading-relaxed text-gray-700">{t.content}</p>
    </article>
  );
}

