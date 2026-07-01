import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { mockEvents, mockNews } from "@/lib/mockPosts";

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
    </div>
  );
}
