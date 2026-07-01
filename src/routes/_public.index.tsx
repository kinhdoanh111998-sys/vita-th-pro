import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  Crown,
} from "lucide-react";
import { EventCard, type EventStatus } from "@/components/app/EventCard";
import { CommunityPost } from "@/components/app/CommunityPost";
import { AffiliateStoreCard } from "@/components/app/AffiliateStoreCard";
import { useAuth } from "@/lib/AuthContext";


const MOCK_BANNERS = [
  { id: 1, image: "https://placehold.co/800x400/png?text=VITA+Banner+1" },
  { id: 2, image: "https://placehold.co/800x400/png?text=Khuyen+Mai+Thang+10" },
  { id: 3, image: "https://placehold.co/800x400/png?text=Ra+Mat+San+Pham+Moi" },
];

const MOCK_STORES = [
  { id: 1, name: "VITA Clinic Quận 1", address: "123 Nguyễn Huệ, Bến Nghé, Q.1", image: "https://placehold.co/400x250/png", rating: "4.9", distance: "1.2 km" },
  { id: 2, name: "VITA Spa Center HN", address: "456 Thái Hà, Đống Đa, Hà Nội", image: "https://placehold.co/400x250/png", rating: "4.8", distance: "3.5 km" },
  { id: 3, name: "VITA Wellness Đà Nẵng", address: "789 Nguyễn Văn Linh, Đà Nẵng", image: "https://placehold.co/400x250/png", rating: "5.0", distance: "5.0 km" },
];


const MOCK_EVENTS: Array<{
  id: number;
  title: string;
  status: EventStatus;
  date: string;
  location: string;
  image: string;
}> = [
  {
    id: 1,
    title: "Hội thảo Da liễu Chuyên sâu",
    status: "Sắp tổ chức",
    date: "20/10/2026 - 08:00",
    location: "Khách sạn JW Marriott",
    image: "https://placehold.co/400x200/png",
  },
  {
    id: 2,
    title: "Lễ ra mắt Máy VITA M04",
    status: "Đang diễn ra",
    date: "Hôm nay",
    location: "VITA Center HN",
    image: "https://placehold.co/400x200/png",
  },
  {
    id: 3,
    title: "Workshop Chăm sóc da mùa đông",
    status: "Đã diễn ra",
    date: "01/10/2026",
    location: "Online Zoom",
    image: "https://placehold.co/400x200/png",
  },
];

export const Route = createFileRoute("/_public/")({
  component: CommunityHome,
});

const SHORTCUTS = [
  { icon: Sparkles, label: "Soi da AI", color: "bg-pink-100 text-pink-600" },
  { icon: Store, label: "Cửa hàng", color: "bg-emerald-100 text-emerald-600" },
  { icon: CalendarDays, label: "Đặt lịch", color: "bg-amber-100 text-amber-600" },
  { icon: QrCode, label: "Quét QR", color: "bg-sky-100 text-sky-600" },
  { icon: Wallet, label: "Ví VITA", color: "bg-violet-100 text-violet-600" },
  { icon: Gift, label: "Ưu đãi", color: "bg-rose-100 text-rose-600" },
];


const MOCK_POSTS = [
  {
    id: 1,
    author: "Hương Tràm",
    avatar: "https://placehold.co/100x100/png",
    time: "2 giờ trước",
    content:
      "Hôm nay trải nghiệm máy VITA M04 tại cơ sở Q1 cực kỳ ưng ý. Da căng bóng và sáng lên hẳn luôn mọi người ạ!",
    images: ["https://placehold.co/600x400/png"],
    likes: 24,
    comments: 5,
  },
  {
    id: 2,
    author: "Admin VITA",
    avatar: "https://placehold.co/100x100/png",
    time: "5 giờ trước",
    content:
      "🎉 Chúc mừng cơ sở liên kết mới tại Đà Nẵng chính thức đi vào hoạt động. Đang có ưu đãi đặc biệt cho các liệu trình chăm sóc da.",
    images: ["https://placehold.co/600x400/png"],
    likes: 156,
    comments: 32,
  },
];


function CommunityHome() {
  return (
    <div className="mx-auto w-full max-w-[480px] md:max-w-none min-h-screen bg-gradient-to-b from-emerald-50/60 to-white pb-24 md:pb-12">
      <UnifiedHeader />



      {/* Hero Banner Carousel */}
      <HeroCarousel />


      {/* Shortcuts */}
      <section className="px-4 md:px-8 pt-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              className="flex flex-col items-center gap-1.5 md:gap-2 group"
            >
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${s.color} group-active:scale-95 transition`}
              >
                <s.icon className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <span className="text-[11px] md:text-sm text-gray-700 text-center leading-tight">
                {s.label}
              </span>
            </button>
          ))}
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

      {/* Featured Events */}
      <section id="events" className="pt-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3 px-4 md:px-8">
          <h2 className="text-base md:text-2xl font-heading font-bold text-gray-900">
            Sự kiện nổi bật
          </h2>
          <button className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible no-scrollbar snap-x md:snap-none snap-mandatory px-4 md:px-8 pb-2">
          {MOCK_EVENTS.map((e) => (
            <EventCard
              key={e.id}
              title={e.title}
              status={e.status}
              date={e.date}
              location={e.location}
              image={e.image}
            />
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
          <div className="md:col-span-8 space-y-4">
            {MOCK_POSTS.map((post) => (
              <CommunityPost key={post.id} {...post} />
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
    </div>
  );
}

function HeroCarousel() {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % MOCK_BANNERS.length;
        const el = scrollerRef.current;
        if (el) {
          el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

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
        {MOCK_BANNERS.map((b) => (
          <div
            key={b.id}
            className="shrink-0 w-full snap-center px-4"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] shadow-md bg-gray-100">
              <img
                src={b.image}
                alt={`Banner ${b.id}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Slider Indicator */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {MOCK_BANNERS.map((b, i) => (
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
    </section>
  );
}

type NavGroup = {
  label: string;
  to: string;
  children?: Array<{ label: string; to: string; search?: Record<string, string> }>;
};

const HEADER_NAV: NavGroup[] = [
  { label: "Trang chủ", to: "/" },
  {
    label: "Giới thiệu",
    to: "/about",
    children: [
      { label: "Về chúng tôi", to: "/about" },
      { label: "Lịch sử phát triển", to: "/about/history" },
      { label: "Đội ngũ", to: "/about/team" },
      { label: "Khách hàng nói về chúng tôi", to: "/about/testimonials" },
      { label: "Chứng nhận - chứng chỉ", to: "/about/certifications" },
    ],
  },
  {
    label: "Tin tức",
    to: "/news",
    children: [
      { label: "Tất cả", to: "/news" },
      { label: "Hoạt động", to: "/news", search: { category: "Hoạt động" } },
      { label: "Sự kiện", to: "/news", search: { category: "Sự kiện" } },
      { label: "Lịch đào tạo", to: "/news", search: { category: "Lịch đào tạo" } },
    ],
  },
  {
    label: "Sản phẩm",
    to: "/products",
    children: [
      { label: "Tất cả", to: "/products" },
      { label: "Máy công nghệ", to: "/products", search: { category: "Máy công nghệ" } },
      { label: "Phụ kiện", to: "/products", search: { category: "Phụ kiện" } },
      { label: "Dịch vụ", to: "/products", search: { category: "Dịch vụ" } },
      { label: "Chuyển giao công nghệ", to: "/products", search: { category: "Chuyển giao công nghệ" } },
    ],
  },
  { label: "Liên hệ", to: "/contact" },
];

function UnifiedHeader() {
  const { session, role } = useAuth();
  const accountTo =
    role === "admin"
      ? "/admin"
      : role === "manager" || role === "staff" || role === "employee"
      ? "/portal/timesheet"
      : role === "customer"
      ? "/portal/my-treatments"
      : "/";

  return (
    <header className="sticky top-0 z-40 bg-[#0b1f14] md:bg-[#0b1f14] bg-white/95 backdrop-blur border-b border-gray-100 md:border-white/5 text-gray-800 md:text-white/90">
      <div className="mx-auto max-w-7xl flex items-center gap-3 px-4 md:px-8 py-3 md:py-4">
        {/* Logo VITA gold */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0 group">
          <div className="relative">
            <Crown className="hidden md:block absolute -top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
            <span className="font-heading font-black text-xl md:text-2xl tracking-tight text-emerald-600 md:text-amber-400">
              VITA
            </span>
          </div>
          <span className="text-[11px] md:text-xs font-bold text-emerald-500 md:text-amber-300/80 mt-1">
            TH®Pro
          </span>
        </Link>

        {/* Desktop nav (từ Header cũ) */}
        <nav className="hidden md:flex items-center gap-1 ml-4 lg:ml-6">
          {HEADER_NAV.map((g) => (
            <div key={g.label} className="relative group">
              <Link
                to={g.to}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-white/85 hover:text-amber-400 hover:bg-white/5 transition-colors"
                activeProps={{ className: "text-amber-400" }}
                activeOptions={{ exact: g.to === "/" }}
              >
                {g.label}
                {g.children && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
              </Link>
              {g.children && (
                <div className="absolute left-0 top-full min-w-[240px] bg-[#0f2a1c] border border-white/10 rounded-2xl p-2 shadow-2xl opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 z-50">
                  {g.children.map((c) => (
                    <Link
                      key={c.label}
                      to={c.to}
                      search={c.search as never}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-white/85 hover:text-amber-400 hover:bg-white/5"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Search: mobile chiếm chỗ, desktop nhỏ gọn nằm cuối */}
        <div className="flex-1 md:flex-none md:ml-auto md:w-64 flex items-center gap-2 bg-gray-100 md:bg-white/10 rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-gray-500 md:text-white/60" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 md:placeholder:text-white/50 md:text-white"
          />
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/lookup"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/90 border border-white/20 hover:border-amber-400 hover:text-amber-400 transition-colors"
          >
            Tra cứu liệu trình
          </Link>
          <Link
            to="/booking"
            className="rounded-full px-4 py-2 text-sm font-bold bg-amber-400 text-[#0b1f14] hover:bg-amber-300 transition-colors"
          >
            Đặt lịch
          </Link>
          {session ? (
            <Link
              to={accountTo}
              className="rounded-full px-4 py-2 text-sm font-semibold text-amber-400 hover:bg-white/5"
            >
              Khu vực của tôi
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/90 hover:text-amber-400"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile login icon (giữ nguyên UX cũ) */}
        <Link
          to={session ? accountTo : "/login"}
          className="md:hidden shrink-0 h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center"
          aria-label={session ? "Khu vực của tôi" : "Đăng nhập"}
        >
          {session ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
        </Link>
      </div>
    </header>
  );
}

