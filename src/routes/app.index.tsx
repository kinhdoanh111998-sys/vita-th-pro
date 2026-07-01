import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, MapPin } from "lucide-react";
import {
  SearchBar,
  FilterTabs,
  StoreCard,
  
  HorizontalScrollList,
  HScrollItem,
  SectionHeader,
} from "@/components/AppComponents";
import { CommunityFeedMobile } from "@/components/CommunityFeed";
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

          {/* Community Feed – realtime */}
          <CommunityFeedMobile />


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

        </>
      )}
    </div>
  );
}
