import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/vita-th-pro-logo.png";
import { useAuth } from "@/lib/AuthContext";

type Tab = {
  to: string;
  label: string;
  exact?: boolean;
  roles?: Array<"admin" | "manager">;
};

const tabs: Tab[] = [
  { to: "/admin", label: "Dashboard", exact: true, roles: ["admin", "manager"] },
  { to: "/admin/bookings", label: "Lịch hẹn", roles: ["admin", "manager"] },
  { to: "/admin/tours", label: "Tour làm cho khách", roles: ["admin", "manager"] },
  { to: "/admin/customers", label: "Khách hàng", roles: ["admin", "manager"] },
  { to: "/admin/treatments", label: "Liệu trình", roles: ["admin", "manager"] },
  { to: "/admin/services", label: "Quản lý Dịch vụ", roles: ["admin", "manager"] },
  { to: "/admin/products", label: "Quản lý Sản phẩm", roles: ["admin", "manager"] },
  { to: "/admin/orders", label: "Đơn hàng", roles: ["admin", "manager"] },
  { to: "/admin/voucher", label: "Voucher / Khuyến mãi", roles: ["admin", "manager"] },
  { to: "/admin/shifts", label: "Ca & Chấm công", roles: ["admin", "manager"] },
  { to: "/admin/commissions", label: "Hoa hồng/Trả thưởng", roles: ["admin", "manager"] },
  { to: "/admin/navigation", label: "Quản lý Trang chủ", roles: ["admin", "manager"] },
  { to: "/admin/banners", label: "Banner", roles: ["admin"] },
  { to: "/admin/stores", label: "Cửa hàng", roles: ["admin", "manager"] },
  { to: "/admin/news", label: "Tin tức & Kiểm duyệt", roles: ["admin", "manager"] },
  { to: "/admin/events", label: "Sự kiện", roles: ["admin", "manager"] },
  { to: "/admin/employees", label: "Tài khoản", roles: ["admin", "manager"] },
  { to: "/admin/settings", label: "Cài đặt/Xuất dữ liệu", roles: ["admin"] },
];


export function AdminSidebar() {
  const { role, email, fullName, signOut } = useAuth();
  const navigate = useNavigate();

  const visible = tabs.filter((t) =>
    !t.roles ? true : role && (t.roles as string[]).includes(role),
  );

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <aside className="bg-brand-surface text-brand-text border-r border-brand-border p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto w-full lg:w-[280px] shrink-0">
      <div className="flex items-center gap-2.5 mb-5 p-3 rounded-[12px] bg-brand-bg">
        <img src={logo} alt="" className="h-11 bg-white rounded-[10px] p-1 border border-brand-border" />
        <div className="min-w-0">
          <b className="block truncate text-[14px] font-heading text-brand-text">{fullName ?? "Quản trị"}</b>
          <small className="text-brand-muted block truncate text-[12px]">{email ?? ""}</small>
          {role && (
            <span className="inline-block mt-1 rounded-full bg-brand-primary-light text-brand-primary-dark text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
              {role}
            </span>
          )}
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {visible.map((t) => (
          <Link
            key={t.to}
            to={t.to as never}
            activeOptions={{ exact: t.exact ?? false }}
            className="w-full text-left rounded-[8px] px-3 py-2.5 text-[14px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
            activeProps={{ className: "bg-brand-primary-light text-brand-primary-dark font-semibold" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 pt-4 border-t border-brand-border space-y-2">
        <Link
          to="/app/account"
          className="block text-center rounded-full bg-brand-bg text-brand-text border border-brand-border px-3 py-2 text-[13px] font-semibold hover:bg-brand-primary-light hover:text-brand-primary-dark transition-colors"
        >
          👤 Hồ sơ của tôi
        </Link>
        <button
          onClick={handleSignOut}
          className="block w-full text-center rounded-full bg-brand-bg text-brand-text border border-brand-border px-3 py-2 text-[13px] font-semibold hover:bg-brand-primary-light hover:text-brand-primary-dark transition-colors"
        >
          Đăng xuất
        </button>
        <Link
          to="/"
          className="block text-center rounded-full bg-brand-primary text-white border border-brand-primary px-3 py-2 text-[13px] font-semibold hover:bg-brand-primary-dark transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
