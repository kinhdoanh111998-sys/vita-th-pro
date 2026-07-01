import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, MapPin } from "lucide-react";
import {
  SearchBar,
  FilterTabs,
  StoreCard,
  ArticleCard,
  HorizontalScrollList,
  HScrollItem,
  SectionHeader,
} from "@/components/AppComponents";
import { mockNews } from "@/lib/mockPosts";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, isUpcoming, type EventRow } from "@/lib/events";

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

const STORES = [
  {
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png",
    name: "Vita Wellness Center – Hà Nội",
    rating: 4.8,
    address: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    distance: "1.2 km",
  },
  {
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/ST-25-3.jpg",
    name: "Vita Spa – Cầu Giấy",
    rating: 4.6,
    address: "45 Trần Thái Tông, Cầu Giấy, Hà Nội",
    distance: "3.4 km",
  },
];

const ARTICLES = [
  {
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-3.png",
    category: "Sự kiện",
    title: "Tuần lễ trải nghiệm công nghệ Vita TH Pro tháng 12",
    meta: "12/12/2026 · Hà Nội",
    metaIcon: "location" as const,
  },
  {
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/z5829969469916_2220fb23d74a91fdb-1726301636717.jpg",
    category: "Đào tạo",
    title: "Khoá đào tạo vận hành máy Cabin AI thải độc",
    meta: "09:00 – 16:00, 18/12",
    metaIcon: "time" as const,
  },
  {
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/71G4Y2zvSKL.jpg",
    category: "Cộng đồng",
    title: "Công nghệ Terahertz – Sứ mệnh bảo vệ sức khỏe",
    meta: "5 phút đọc",
    metaIcon: "time" as const,
  },
];

function AppHome() {
  const [tab, setTab] = useState("Tất cả");
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
  const upcomingEvents = (eventsQ.data ?? []).filter(isUpcoming).slice(0, 6);

  return (
    <div>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Xin chào,</p>
            <h1 className="font-heading text-lg">Cộng đồng Vita 👋</h1>
          </div>
          <button className="ml-auto relative w-10 h-10 rounded-full bg-white border border-gray-100 grid place-items-center">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-error" />
          </button>
        </div>
        <SearchBar placeholder="Tìm sự kiện, cửa hàng, bài viết..." />
        <FilterTabs tabs={TABS} active={tab} onChange={setTab} />
      </header>

      {tab === "Sự kiện" ? (
        <>
          <SectionHeader
            title="Sự kiện sắp diễn ra"
            action={
              <Link to="/app/events" className="text-xs text-brand-primary">
                Xem tất cả
              </Link>
            }
          />
          <div className="px-4 flex flex-col gap-3 pb-4">
            {upcomingEvents.length === 0 && (
              <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-gray-500 text-sm">
                Chưa có sự kiện sắp diễn ra
              </div>
            )}
            {upcomingEvents.map((e) => (
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
                  <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                    Sắp diễn ra
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
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Hero banner */}
          <section className="px-4 mt-2">
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white p-5 shadow-lg">
              <span className="inline-flex text-[11px] font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">
                Ưu đãi thành viên
              </span>
              <h2 className="font-heading text-xl mt-2 text-white">
                Trải nghiệm liệu trình miễn phí
              </h2>
              <p className="text-sm text-white/85 mt-1">
                Đặt lịch ngay để nhận buổi trải nghiệm và tư vấn cá nhân hoá.
              </p>
              <button className="mt-3 bg-white text-brand-primary text-sm font-semibold px-4 py-2 rounded-full">
                Khám phá ngay
              </button>
            </div>
          </section>

          {/* Sự kiện nổi bật – horizontal */}
          <SectionHeader
            title="Sự kiện nổi bật"
            action={<span className="text-xs text-brand-primary">Xem tất cả</span>}
          />
          <HorizontalScrollList>
            {ARTICLES.map((a) => (
              <HScrollItem key={a.title}>
                <ArticleCard {...a} />
              </HScrollItem>
            ))}
          </HorizontalScrollList>

          {/* Bản tin sức khoẻ – horizontal thumbnails */}
          <SectionHeader
            title="Bản tin sức khoẻ"
            action={<span className="text-xs text-brand-primary">Xem tất cả</span>}
          />
          <div className="px-4 pb-1 flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {mockNews.map((n) => (
              <article
                key={n.id}
                className="shrink-0 w-40 snap-start bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <h3 className="text-[12.5px] font-heading font-bold text-gray-900 line-clamp-2 leading-snug">
                    {n.title}
                  </h3>
                  <p className="mt-1 text-[10.5px] text-gray-400">{n.date}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Cửa hàng gần bạn */}
          <SectionHeader
            title="Cửa hàng gần bạn"
            action={<span className="text-xs text-brand-primary">Xem bản đồ</span>}
          />
          <div className="px-4 flex flex-col gap-3">
            {STORES.map((s) => (
              <StoreCard key={s.name} {...s} />
            ))}
          </div>

          {/* Bài viết cộng đồng – vertical */}
          <SectionHeader title="Bài viết cộng đồng" />
          <div className="px-4 grid grid-cols-1 gap-3">
            {ARTICLES.map((a) => (
              <ArticleCard key={"v-" + a.title} {...a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
