import { Link } from "@tanstack/react-router";
import logo from "@/assets/vita-th-pro-logo.png";

const tabs = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/banners", label: "Banner sự kiện" },
  { to: "/admin/catalog", label: "Sản phẩm/Dịch vụ" },
  { to: "/admin/posts", label: "Tin tức/Hoạt động/Đào tạo" },
  { to: "/admin/customers", label: "Khách hàng" },
  { to: "/admin/bookings", label: "Lịch hẹn" },
  { to: "/admin/treatments", label: "Liệu trình" },
  { to: "/admin/orders", label: "Đơn hàng" },
  { to: "/admin/employees", label: "Nhân viên" },
  { to: "/admin/tours", label: "Tour làm cho khách" },
  { to: "/admin/commissions", label: "Hoa hồng/Trả thưởng" },
  { to: "/admin/settings", label: "Cài đặt/Xuất dữ liệu" },
] as const;

export function AdminSidebar() {
  return (
    <aside className="bg-[#112218] text-white p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto w-full lg:w-[280px] shrink-0">
      <div className="flex items-center gap-2.5 mb-4">
        <img src={logo} alt="" className="h-11 bg-white rounded-[10px] p-1" />
        <div>
          <b className="block">Quản trị demo</b>
          <small className="text-[#bdd7c2]">admin@vitath.pro</small>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact ?? false }}
            className="w-full text-left rounded-xl px-3 py-2.5 font-extrabold text-[#dff5e3] hover:bg-white/10 hover:text-white"
            activeProps={{ className: "bg-white/15 text-white" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        <Link
          to="/"
          className="block text-center rounded-full bg-white text-brand-dark border border-hairline px-3 py-2 text-[13px] font-extrabold"
        >
          Thoát quản trị
        </Link>
      </div>
    </aside>
  );
}
