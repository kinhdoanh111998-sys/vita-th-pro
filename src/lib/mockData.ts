// Mock data extracted from the original Vanilla JS demo (app.js).
// UI-only: no LocalStorage, no business logic.

const today = (plus = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + plus);
  return d.toISOString().slice(0, 10);
};

export const settings = {
  brand: "Vita TH Pro",
  tagline:
    "Website chăm sóc sức khỏe, đặt lịch, quản lý liệu trình và chuyển giao công nghệ.",
  hotline: "0988 000 888",
  zalo: "0988 000 888",
  email: "contact@vitath.pro",
  address: "Hà Nội, Việt Nam",
};

export const banners = [
  {
    id: "BN001",
    title: "Tuần lễ trải nghiệm công nghệ Vita TH Pro",
    subtitle:
      "Đặt lịch trải nghiệm máy công nghệ, nhận tư vấn liệu trình phù hợp và ưu đãi thuê/mua máy trong tháng.",
    type: "Sự kiện",
    cta: "Đặt lịch ngay",
    image: "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png",
  },
  {
    id: "BN002",
    title: "Chuyển giao công nghệ cho chủ cơ sở",
    subtitle:
      "Bộ giải pháp gồm máy công nghệ, quy trình vận hành, đào tạo nhân viên, quản trị khách hàng và website demo.",
    type: "Chuyển giao",
    cta: "Tìm hiểu chuyển giao",
    image: "https://vitath.pro/wp-content/uploads/2025/11/ST-25-3.jpg",
  },
  {
    id: "BN003",
    title: "Lịch đào tạo vận hành hệ thống tháng này",
    subtitle:
      "Cập nhật lịch đào tạo sản phẩm, chăm sóc khách hàng, bán hàng, tour dịch vụ và quản lý liệu trình.",
    type: "Đào tạo",
    cta: "Xem lịch đào tạo",
    image: "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-3.png",
  },
];

export type Product = {
  id: string;
  type: string;
  name: string;
  price: number;
  summary: string;
  status: string;
  image: string;
  source: string;
};

export const catalog: Product[] = [
  { id: "SP001", type: "Máy công nghệ", name: "Vita M01 – Máy Cabin AI thải độc – tái sinh – làm đẹp (BIG)", price: 180000000, summary: "Thiết bị chăm sóc sức khỏe ứng dụng trí tuệ AI, phù hợp trung tâm dưỡng sinh, spa và mô hình chăm sóc sức khỏe chủ động.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/12/Vita-M01-May-Cabin-AI-thai-doc-tai-sinh-lam-dep-BIG-400x400.jpg", source: "vitath.pro" },
  { id: "SP002", type: "Máy công nghệ", name: "Vita M04 – Máy xông hơi nước thải độc – dưỡng sinh", price: 135000000, summary: "Dòng máy xông hơi nước thải độc – dưỡng sinh, phù hợp cơ sở chăm sóc sức khỏe và dịch vụ thư giãn.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/12/Vita-M04-May-xong-hoi-nuoc-thai-doc-duong-sinh-400x400.jpg", source: "vitath.pro" },
  { id: "SP003", type: "Máy công nghệ", name: "Vita M03 – Máy cabin AI thải độc – Gia đình", price: 140000000, summary: "Dòng cabin AI thải độc dùng cho gia đình hoặc cơ sở nhỏ, hỗ trợ trải nghiệm chăm sóc sức khỏe chủ động.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/12/Vita-M03-May-cabin-AI-thai-doc-Gia-dinh-400x400.jpg", source: "vitath.pro" },
  { id: "SP004", type: "Máy công nghệ", name: "Vita M05 – Máy giải cơ châm cứu – siêu âm cao cấp", price: 75000000, summary: "Máy công nghệ phục vụ chăm sóc vùng cơ, trị liệu thư giãn và dịch vụ chuyên sâu tại cơ sở.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/11/Vita-M05-May-giai-co-cham-cuu-sieu-am-cao-cap-400x400.jpg", source: "vitath.pro" },
  { id: "SP005", type: "Máy công nghệ", name: "Vita M06 – Máy TERAHERTZ chân – đai bụng + siêu âm", price: 45000000, summary: "Thiết bị Terahertz cho chăm sóc chân, đai bụng và đầu siêu âm cầm tay, phù hợp gói dịch vụ chăm sóc định kỳ.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/11/Vita-M06-May-TERAHERTZ-chan-dai-bung-sieu-am-400x400.jpg", source: "vitath.pro" },
  { id: "SP006", type: "Máy công nghệ", name: "Vita M09 – Máy TERAHERTZ chân – Trắng", price: 15000000, summary: "Thiết bị chăm sóc chân công nghệ Terahertz, phù hợp bán lẻ, dùng tại nhà hoặc gói dịch vụ chăm sóc chân.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/11/Vita-M09-May-TERAHERTZ-chan-Trang-400x400.jpg", source: "vitath.pro" },
  { id: "DV002", type: "Dịch vụ", name: "Gói chăm sóc liệu trình 5 buổi", price: 3500000, summary: "Gói dịch vụ theo số buổi; mỗi buổi được ghi nhận thành tour, phân công nhân viên và trừ số buổi còn lại.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/11/z5829969469916_2220fb23d74a91fdb-1726301636717.jpg", source: "Vita TH Pro" },
  { id: "CG001", type: "Chuyển giao công nghệ", name: "Gói chuyển giao cơ sở mới", price: 0, summary: "Bộ giải pháp cho chủ cơ sở: máy công nghệ, quy trình vận hành, đào tạo nhân viên, nội dung truyền thông và website quản lý.", status: "Hiển thị", image: "https://vitath.pro/wp-content/uploads/2025/11/ST-25-3.jpg", source: "Vita TH Pro/SKVI" },
];

export const posts = [
  { id: "TT001", category: "Hoạt động", title: "Hoạt động trải nghiệm công nghệ chăm sóc sức khỏe", date: "11/11/2025", summary: "Cập nhật hình ảnh trải nghiệm công nghệ AI trong chăm sóc sức khỏe, dùng làm nội dung truyền thông thu hút khách đặt lịch.", image: "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png" },
  { id: "TT002", category: "Tin tức", title: "Công nghệ AI | Bệnh viện 199 ứng dụng AI vào chăm sóc sức khỏe", date: "11/11/2025", summary: "Bài viết trên Vita TH Pro nêu việc ứng dụng AI vào chẩn đoán hình ảnh, camera, phục hồi chức năng và chăm sóc khách hàng.", image: "https://vitath.pro/wp-content/uploads/2025/11/z5829969469916_2220fb23d74a91fdb-1726301636717.jpg" },
  { id: "TT004", category: "Tin tức", title: "Công nghệ Terahertz – Sứ mệnh bảo vệ sức khỏe con người", date: "10/11/2025", summary: "Bài viết giới thiệu công nghệ Terahertz, đặc tính không ion hóa và các ứng dụng tiềm năng trong y tế, an ninh, công nghiệp.", image: "https://vitath.pro/wp-content/uploads/2025/11/71G4Y2zvSKL.jpg" },
];

export const customers = [
  { id: "KH001", name: "Nguyễn Minh An", phone: "0901111222", source: "Website", note: "Quan tâm gói trải nghiệm", status: "Đang chăm sóc" },
  { id: "KH002", name: "Trần Thu Hà", phone: "0903333444", source: "Nhân viên nhập", note: "Khách mua gói 5 buổi", status: "Đang dùng liệu trình" },
];

export const bookings = [
  { id: "LH001", customerName: "Nguyễn Minh An", phone: "0901111222", service: "Tư vấn trải nghiệm công nghệ", date: today(1), time: "09:00", employee: "Nhân viên tư vấn A", status: "Chờ xác nhận" },
  { id: "LH002", customerName: "Trần Thu Hà", phone: "0903333444", service: "Gói chăm sóc liệu trình 5 buổi", date: today(0), time: "15:30", employee: "Kỹ thuật viên B", status: "Đã xác nhận" },
];

export const employees = [
  { id: "NV001", name: "Quản lý cơ sở", phone: "0988000001", role: "Quản lý", status: "Hoạt động" },
  { id: "NV002", name: "Nhân viên tư vấn A", phone: "0988000002", role: "Tư vấn / Bán hàng", status: "Hoạt động" },
  { id: "NV003", name: "Kỹ thuật viên B", phone: "0988000003", role: "Kỹ thuật viên", status: "Hoạt động" },
];

export const kpis = [
  { label: "Khách hàng", value: customers.length },
  { label: "Lịch hẹn hôm nay", value: 2 },
  { label: "Đơn hàng tháng", value: 1 },
  { label: "Doanh thu (đ)", value: "3.500.000" },
];

export const money = (n: number) =>
  Number(n || 0).toLocaleString("vi-VN") + "đ";
