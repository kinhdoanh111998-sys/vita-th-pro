// Centralized mock posts data (news + events) used across the
// public homepage and mobile /app view. UI-only, no backend.

export type PostCategory = "news" | "event";

export interface MockPost {
  id: number;
  title: string;
  summary: string;
  image: string;
  category: PostCategory;
  date: string;       // Ngày đăng
  eventDate?: string; // Chỉ dành cho sự kiện
  location?: string;
  is_featured?: boolean;
}

export const mockPosts: MockPost[] = [
  {
    id: 1,
    title: "Tuần lễ trải nghiệm công nghệ VITA TH Pro",
    summary:
      "Đặt lịch trải nghiệm cabin AI thải độc và nhận tư vấn liệu trình cá nhân hoá miễn phí trong suốt tuần lễ khai trương.",
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png",
    category: "event",
    date: "05/12/2026",
    eventDate: "12/12/2026 · 09:00 – 17:00",
    location: "VITA Center – Hà Nội",
    is_featured: true,
  },
  {
    id: 2,
    title: "Hội thảo Da liễu Chuyên sâu 2026",
    summary:
      "Hội thảo cùng các chuyên gia đầu ngành về ứng dụng công nghệ Terahertz trong chăm sóc da và phục hồi tái tạo.",
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/ST-25-3.jpg",
    category: "event",
    date: "01/12/2026",
    eventDate: "20/12/2026 · 08:30 – 12:00",
    location: "JW Marriott Hà Nội",
    is_featured: true,
  },
  {
    id: 3,
    title: "Workshop Chăm sóc da mùa đông",
    summary:
      "Bí quyết chăm sóc da mùa hanh khô và trải nghiệm miễn phí liệu trình dưỡng ẩm chuyên sâu với chuyên gia VITA.",
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-3.png",
    category: "event",
    date: "20/11/2026",
    eventDate: "28/12/2026 · 14:00 – 17:00",
    location: "Online qua Zoom",
  },
  {
    id: 4,
    title: "Công nghệ Terahertz – Sứ mệnh bảo vệ sức khoẻ",
    summary:
      "Cùng khám phá công nghệ Terahertz không ion hoá đang được ứng dụng rộng rãi trong y tế và chăm sóc sức khoẻ chủ động.",
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/71G4Y2zvSKL.jpg",
    category: "news",
    date: "18/11/2026",
    is_featured: true,
  },
  {
    id: 5,
    title: "AI trong chăm sóc sức khoẻ tại Bệnh viện 199",
    summary:
      "Bệnh viện 199 ứng dụng AI vào chẩn đoán hình ảnh, phục hồi chức năng và chăm sóc khách hàng – bước tiến mới của y tế số.",
    image:
      "https://vitath.pro/wp-content/uploads/2025/11/z5829969469916_2220fb23d74a91fdb-1726301636717.jpg",
    category: "news",
    date: "11/11/2026",
  },
  {
    id: 6,
    title: "5 thói quen dưỡng sinh nên duy trì mỗi ngày",
    summary:
      "Từ hơi thở, giấc ngủ tới chế độ ăn – 5 thói quen đơn giản giúp bạn nâng cao sức khoẻ chủ động và tinh thần tích cực.",
    image:
      "https://vitath.pro/wp-content/uploads/2025/12/Vita-M01-May-Cabin-AI-thai-doc-tai-sinh-lam-dep-BIG-400x400.jpg",
    category: "news",
    date: "05/11/2026",
  },
];

export const mockEvents = mockPosts.filter((p) => p.category === "event");
export const mockNews = mockPosts.filter((p) => p.category === "news");
