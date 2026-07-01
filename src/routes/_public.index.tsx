import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { EventCard, type EventStatus } from "@/components/app/EventCard";
import { CommunityPost } from "@/components/app/CommunityPost";


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
    <div className="mx-auto w-full max-w-[480px] min-h-screen bg-gradient-to-b from-emerald-50/60 to-white pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-lg font-heading font-bold text-emerald-600">VITA</span>
            <span className="text-xs font-semibold text-emerald-500">TH®Pro</span>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, dịch vụ..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          <Link
            to="/login"
            className="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center"
            aria-label="Đăng nhập"
          >
            <LogIn className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="px-4 pt-4">
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-md">
          <div className="absolute top-3 left-3 bg-white/95 rounded-lg px-3 py-1.5 shadow">
            <p className="text-[10px] text-gray-500">Thành viên mới hôm nay</p>
            <p className="text-sm font-bold text-emerald-600">+127</p>
          </div>
          <div className="absolute bottom-3 right-3 bg-white/95 rounded-lg px-3 py-2 shadow max-w-[70%]">
            <p className="text-[10px] text-gray-500">Sự kiện sắp tới</p>
            <p className="text-sm font-semibold text-gray-900">VITA Marathon Mùa Hè 2025</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">🏆 +500 điểm khi tham dự</p>
          </div>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          <span className="w-6 h-1.5 rounded-full bg-emerald-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </section>

      {/* Shortcuts */}
      <section className="px-4 pt-5">
        <div className="grid grid-cols-4 gap-3">
          {SHORTCUTS.map((s) => (
            <button
              key={s.label}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.color} group-active:scale-95 transition`}
              >
                <s.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-gray-700 text-center leading-tight">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-bold text-gray-900">
            Sự kiện nổi bật
          </h2>
          <button className="text-xs text-emerald-600 flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
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

      {/* Community Feed */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-bold text-gray-900">
            Hoạt động cộng đồng
          </h2>
          <button className="text-xs text-emerald-600 flex items-center gap-0.5">
            Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-4">
          {MOCK_POSTS.map((post) => (
            <CommunityPost key={post.id} {...post} />
          ))}
        </div>
      </section>


      {/* Public Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-50">
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
