import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, MapPin, Sparkles, Store, QrCode, Wallet, Gift,
} from "lucide-react";
import {
  SearchBar,
  FilterTabs,
  StoreCard,
  SectionHeader,
} from "@/components/AppComponents";
import { CommunityFeedMobile } from "@/components/CommunityFeed";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, isUpcoming, type EventRow } from "@/lib/events";
import { useActiveStores } from "@/lib/useStores";
import { useNavigationItems } from "@/lib/useNavigationItems";
import { useSystemSettings } from "@/lib/useSystemSettings";
import { FeaturedCatalogSection } from "@/components/FeaturedCatalogSection";


export const Route = createFileRoute("/app/")({
  component: AppHome,
});

const TABS = [
  "Tất cả",
  "Sự kiện",
  "Cộng đồng",
  "Ưu đãi",
  "Đào tạo",
  "Tra cứu liệu trình",
  "Đặt lịch",
];

const QUICK_ICONS: Record<string, { icon: typeof Sparkles; color: string }> = {
  skin_ai:  { icon: Sparkles,     color: "bg-pink-100 text-pink-600" },
  store:    { icon: Store,        color: "bg-emerald-100 text-emerald-600" },
  booking:  { icon: CalendarDays, color: "bg-amber-100 text-amber-600" },
  scan:     { icon: QrCode,       color: "bg-sky-100 text-sky-600" },
  wallet:   { icon: Wallet,       color: "bg-violet-100 text-violet-600" },
  vouchers: { icon: Gift,         color: "bg-rose-100 text-rose-600" },
};




function AppHome() {
  const [tab, setTab] = useState("Tất cả");
  const { data: stores = [] } = useActiveStores();
  const { data: appNav = [] } = useNavigationItems("app");
  const { data: sys } = useSystemSettings();
  const freeTrialName = sys?.free_trial_campaign || "Trải nghiệm liệu trình miễn phí";
  const showStoreList = sys?.show_store_list !== false;
  const quickItems = appNav.filter((i) => i.is_visible);


  const eventsQ = useQuery({
    queryKey: ["public", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });
  const allEvents = eventsQ.data ?? [];
  const upcomingEvents = allEvents.filter(isUpcoming);
  const pastEvents = allEvents.filter((e) => !isUpcoming(e));



  return (
    <div>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Xin chào,</p>
            <h1 className="font-heading text-lg">Cộng đồng Vita 👋</h1>
          </div>
          <div className="ml-auto w-10 h-10" />
        </div>
        <SearchBar placeholder="Tìm sự kiện, cửa hàng, bài viết..." />
        <FilterTabs tabs={TABS} active={tab} onChange={setTab} />
      </header>

      {tab === "Sự kiện" ? (
        <>
          <EventList
            title="Sự kiện sắp diễn ra"
            items={upcomingEvents}
            empty="Chưa có sự kiện sắp diễn ra"
            upcoming
          />
          <EventList
            title="Sự kiện đã diễn ra"
            items={pastEvents}
            empty="Chưa có sự kiện đã diễn ra"
          />
          <div className="px-4 pt-2 pb-4">
            <Link
              to="/app/events"
              className="block text-center h-11 leading-[44px] rounded-xl bg-white border border-gray-200 text-sm font-semibold text-brand-primary"
            >
              Xem tất cả sự kiện
            </Link>
          </div>
        </>
      ) : (

        <>
          {/* Hero banner (Đã được làm động) */}
          <section className="px-4 mt-2">
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white p-5 shadow-lg">
              <span className="inline-flex text-[11px] font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">
                Ưu đãi thành viên
              </span>
              <h2 className="font-heading text-xl mt-2 text-white">
                {freeTrialName}
              </h2>
              <p className="text-sm text-white/85 mt-1">
                Đặt lịch ngay để nhận buổi trải nghiệm và tư vấn cá nhân hoá.
              </p>
              <Link 
                to="/booking"
                search={{ note: freeTrialName }}
                className="mt-3 inline-flex bg-white text-brand-primary text-sm font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
              >
                Khám phá ngay
              </Link>
            </div>
          </section>

          {/* Sản phẩm nổi bật + Dịch vụ nổi bật (trước Feed) */}
          <FeaturedCatalogSection
            kind="product"
            eyebrow="Cửa hàng"
            title="Sản phẩm nổi bật"
            viewAllHref="/products"
            variant="app"
            limit={4}
          />
          <FeaturedCatalogSection
            kind="service"
            eyebrow="Liệu trình"
            title="Dịch vụ nổi bật"
            viewAllHref="/services"
            variant="app"
            limit={4}
          />

          {/* Community Feed – realtime */}
          <CommunityFeedMobile />



          {/* Quick Access (dynamic from DB) */}
          {quickItems.length > 0 && (
            <section className="px-4 mt-4">
              <div className="grid grid-cols-4 gap-3">
                {quickItems.map((item) => {
                  const meta = QUICK_ICONS[item.menu_key] ?? { icon: Sparkles, color: "bg-gray-100 text-gray-600" };
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.route}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.color} active:scale-95 transition`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] text-gray-700 text-center leading-tight">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Cửa hàng gần bạn — có thể ẩn qua admin.navigation */}
          {showStoreList && (
            <>
              <SectionHeader
                title="Cửa hàng gần bạn"
                action={<span className="text-xs text-brand-primary">Xem bản đồ</span>}
              />
              <div className="px-4 flex flex-col gap-3">
                {stores.map((s) => (
                  <StoreCard
                    key={s.id}
                    image={s.main_image ?? s.images?.[0] ?? "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png"}
                    name={s.name}
                    rating={4.8}
                    address={s.address ?? ""}
                    distance={s.open_hours ?? ""}
                  />
                ))}
              </div>
            </>
          )}



        </>
      )}
    </div>
  );
}


function EventList({
  title,
  items,
  empty,
  upcoming = false,
}: {
  title: string;
  items: EventRow[];
  empty: string;
  upcoming?: boolean;
}) {
  return (
    <>
      <SectionHeader title={title} />
      <div className="px-4 flex flex-col gap-3 pb-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-gray-500 text-sm">
            {empty}
          </div>
        ) : (
          items.map((e) => (
            <Link
              key={e.id}
              to="/app/events/$id"
              params={{ id: e.id }}
              className="flex gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
            >
              {e.cover_url ? (
                <img
                  src={e.cover_url}
                  alt={e.title}
                  loading="lazy"
                  className="w-28 h-28 object-cover shrink-0"
                />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-100 to-amber-50 shrink-0" />
              )}
              <div className="flex-1 py-2.5 pr-3 flex flex-col gap-1 min-w-0">
                <span
                  className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    upcoming
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {upcoming ? "Sắp diễn ra" : "Đã diễn ra"}
                </span>
                <h3 className="text-sm font-heading font-bold text-gray-900 line-clamp-2 leading-snug">
                  {e.title}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                  <CalendarDays className="w-3 h-3 text-emerald-600" />
                  <span className="truncate">{formatDateTime(e.start_at)}</span>
                </div>
                {e.location && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span className="truncate">{e.location}</span>
                  </div>
                )}
                {upcoming && (
                  <span className="mt-1 inline-flex w-fit items-center h-7 px-3 rounded-full bg-brand-primary text-white text-[11px] font-bold">
                    Đăng ký tham gia
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

