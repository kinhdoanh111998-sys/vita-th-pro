// Mapping pathname → tên trang (không bao gồm hậu tố thương hiệu).
// Trang chủ trả về null để hiển thị nguyên "Vita TH Pro".
const BRAND = "Vita TH Pro";

const EXACT: Record<string, string | null> = {
  "/": null,

  // Public
  "/about": "Về chúng tôi",
  "/about/history": "Lịch sử phát triển",
  "/about/team": "Đội ngũ chuyên gia",
  "/about/certifications": "Chứng nhận & Chứng chỉ",
  "/about/testimonials": "Khách hàng nói về chúng tôi",
  "/booking": "Đặt lịch hẹn",
  "/contact": "Liên hệ",
  "/community": "Cộng đồng",
  "/events": "Sự kiện",
  "/lookup": "Tra cứu liệu trình",
  "/wallet": "Ví VITA & Ưu đãi",
  "/project-status": "Theo dõi tiến độ dự án",
  "/news": "Tin tức",
  "/news/activities": "Hoạt động",
  "/news/events": "Sự kiện",
  "/news/training": "Lịch đào tạo",
  "/products": "Sản phẩm",
  "/products/machines": "Máy công nghệ",
  "/products/accessories": "Phụ kiện",
  "/products/services": "Dịch vụ",
  "/products/technology-transfer": "Chuyển giao công nghệ",
  "/services": "Dịch vụ & Liệu trình",

  // Auth
  "/login": "Đăng nhập",
  "/dang-ky": "Đăng ký",
  "/khach-hang": "Khách hàng",
  "/khach-hang/qr": "Mã QR khách hàng",
  "/auth/zalo/callback": "Đăng nhập Zalo",

  // App (khách hàng)
  "/app": "Trang chủ khách hàng",
  "/app/account": "Tài khoản",
  "/app/events": "Sự kiện",
  "/app/news": "Tin tức",
  "/app/notifications": "Thông báo",
  "/app/scan": "Quét mã",
  "/app/store": "Cửa hàng",
  "/app/store/checkout": "Thanh toán",

  // Portal (nhân viên)
  "/portal": "Portal nhân viên",
  "/portal/dashboard": "Bảng điều khiển",
  "/portal/affiliate": "Cộng tác viên",
  "/portal/bookings": "Lịch hẹn",
  "/portal/contacts": "Liên hệ",
  "/portal/content": "Nội dung",
  "/portal/my-treatments": "Liệu trình của tôi",
  "/portal/timesheet": "Chấm công",

  // Admin
  "/admin": "Bảng điều khiển Admin",
  "/admin/banners": "Banner",
  "/admin/bookings": "Đặt lịch",
  "/admin/commissions": "Hoa hồng",
  "/admin/customers": "Khách hàng",
  "/admin/employees": "Tài khoản",
  "/admin/events": "Sự kiện",
  "/admin/navigation": "Điều hướng",
  "/admin/news": "Tin tức",
  "/admin/orders": "Đơn hàng",
  "/admin/products": "Sản phẩm",
  "/admin/services": "Dịch vụ",
  "/admin/settings": "Cài đặt hệ thống",
  "/admin/shifts": "Ca làm việc",
  "/admin/stores": "Cơ sở",
  "/admin/tours": "Ca làm",
  "/admin/treatments": "Liệu trình",
  "/admin/voucher": "Voucher",
};

const PREFIX: Array<[string, string]> = [
  ["/events/", "Chi tiết sự kiện"],
  ["/news/", "Chi tiết tin tức"],
  ["/products/", "Chi tiết sản phẩm"],
  ["/services/", "Chi tiết dịch vụ"],
  ["/app/events/", "Chi tiết sự kiện"],
  ["/app/news/", "Chi tiết tin tức"],
  ["/app/store/", "Chi tiết sản phẩm"],
  ["/admin/", "Quản trị"],
];

export function getPageTitle(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean in EXACT) {
    const name = EXACT[clean];
    return name ? `${name} | ${BRAND}` : BRAND;
  }
  for (const [pfx, label] of PREFIX) {
    if (clean.startsWith(pfx)) return `${label} | ${BRAND}`;
  }
  return BRAND;
}
