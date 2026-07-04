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
  MapPin,
  Phone,
} from "lucide-react";
import { CommunityFeedPC } from "@/components/CommunityFeed";
import { useSettings } from "@/lib/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import logo from "@/assets/vita-th-pro-logo.png";
import { useActiveStores } from "@/lib/useStores";
import { useNavigationItems } from "@/lib/useNavigationItems";
import { useSystemSettings } from "@/lib/useSystemSettings";
import { FeaturedCatalogSection } from "@/components/FeaturedCatalogSection";







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

const BRANCH_GRADIENTS = [
  "from-rose-500 via-pink-500 to-amber-400",
  "from-sky-500 via-indigo-500 to-violet-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-fuchsia-500 via-purple-500 to-indigo-500",
];

export const Route = createFileRoute("/_public/")({
  component: CommunityHome,
});

type ShortcutIcon = typeof Sparkles;

const SHORTCUT_ICONS: Record<string, { icon: ShortcutIcon; color: string }> = {
  skin_ai:  { icon: Sparkles, color: "bg-pink-100 text-pink-600" },
  store:    { icon: Store, color: "bg-emerald-100 text-emerald-600" },
  booking:  { icon: CalendarDays, color: "bg-amber-100 text-amber-600" },
  scan:     { icon: QrCode, color: "bg-sky-100 text-sky-600" },
  wallet:   { icon: Wallet, color: "bg-violet-100 text-violet-600" },
  vouchers: { icon: Gift, color: "bg-rose-100 text-rose-600" },
};

const SKIN_AI_KEY = "skin_ai";



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
  const { session, loading: authLoading } = useAuth();
  const brand = settings?.brand ?? "Vita TH Pro";
  const hotline = settings?.hotline ?? "0988 000 888";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [skinAIOpen, setSkinAIOpen] = useState(false);

  const { data: stores = [] } = useActiveStores();
  const { data: appNavItems = [] } = useNavigationItems("app");
  const { data: sys } = useSystemSettings();
  const showStoreList = sys?.show_store_list !== false;
  const shortcuts = appNavItems.filter((i) => i.is_visible);




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
      {/* Header + Mobile Drawer are provided by the shared PublicLayout Header */}





      <HeroCarousel />



      {/* Shortcuts */}
      <section className="px-4 md:px-8 pt-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {shortcuts.map((s) => {
            const meta = SHORTCUT_ICONS[s.menu_key] ?? { icon: Sparkles, color: "bg-gray-100 text-gray-600" };
            const Icon = meta.icon;
            const inner = (
              <>
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${meta.color} group-active:scale-95 transition`}
                >
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span className="text-[11px] md:text-sm text-gray-700 text-center leading-tight">
                  {s.label}
                </span>
              </>
            );
            if (s.menu_key === SKIN_AI_KEY) {
              return (
                <button
                  key={s.id}
                  onClick={() => setSkinAIOpen(true)}
                  className="flex flex-col items-center gap-1.5 md:gap-2 group"
                >
                  {inner}
                </button>
              );
            }
            return (
              <Link
                key={s.id}
                to={s.route}
                className="flex flex-col items-center gap-1.5 md:gap-2 group"
              >
                {inner}
              </Link>
            );
          })}

        </div>
      </section>



      {/* Hệ thống cơ sở VITA — có thể ẩn qua admin.navigation */}
      {showStoreList && (
      <section id="stores" className="pt-10 max-w-7xl mx-auto w-full px-4 md:px-8">

        <div className="text-center mb-6 md:mb-8">
          <div className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2">
            Hệ thống trực thuộc
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-black text-gray-900">
            HỆ THỐNG CƠ SỞ SPA & CLINIC VITA TH PRO
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-20 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {stores.map((b, i) => {
            const gradient = BRANCH_GRADIENTS[i % BRANCH_GRADIENTS.length];
            const hotline = b.hotline ?? b.phone ?? "";
            return (
              <article
                key={b.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`relative h-40 md:h-48 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  {b.main_image && (
                    <img
                      src={b.main_image}
                      alt={b.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.35),transparent_60%)]" />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/25 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                    <Store className="w-3.5 h-3.5" /> VITA TH PRO
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-md leading-tight">
                      {b.name}
                    </h3>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {b.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                      <span className="leading-relaxed">{b.address}</span>
                    </div>
                  )}
                  {hotline && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <a
                        href={`tel:${hotline.replace(/\s/g, "")}`}
                        className="font-bold text-gray-900 hover:text-emerald-600"
                      >
                        {hotline}
                      </a>
                    </div>
                  )}
                  <a
                    href={
                      b.address
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`
                        : "#"
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full rounded-full border-2 border-emerald-600 text-emerald-700 font-bold text-sm py-2.5 hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> Xem bản đồ
                  </a>
                </div>
              </article>
            );
          })}

        </div>
      </section>
      )}

      {/* Sản phẩm nổi bật + Dịch vụ nổi bật (đặt trước Feed) */}
      <FeaturedCatalogSection
        kind="product"
        eyebrow="Cửa hàng"
        title="Sản phẩm nổi bật"
        viewAllHref="/products"
      />
      <FeaturedCatalogSection
        kind="service"
        eyebrow="Liệu trình"
        title="Dịch vụ nổi bật"
        viewAllHref="/services"
      />

      {/* Community Feed – realtime từ Sự kiện + Tin tức */}
      <CommunityFeedPC />



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

