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
  { to: "/admin/banners", label: "Banner", roles: ["admin"] },
  { to: "/admin/products", label: "Quản lý Sản phẩm", roles: ["admin", "manager"] },
  { to: "/admin/services", label: "Quản lý Dịch vụ", roles: ["admin", "manager"] },
  { to: "/admin/news", label: "Tin tức & Kiểm duyệt", roles: ["admin", "manager"] },
  { to: "/admin/events", label: "Sự kiện", roles: ["admin", "manager"] },
  { to: "/admin/customers", label: "Khách hàng", roles: ["admin", "manager"] },
  { to: "/admin/bookings", label: "Lịch hẹn", roles: ["admin", "manager"] },
  { to: "/admin/treatments", label: "Liệu trình", roles: ["admin", "manager"] },
  { to: "/admin/orders", label: "Đơn hàng", roles: ["admin", "manager"] },
  { to: "/admin/employees", label: "Nhân viên", roles: ["admin", "manager"] },
  { to: "/admin/tours", label: "Tour làm cho khách", roles: ["admin", "manager"] },
  { to: "/admin/commissions", label: "Hoa hồng/Trả thưởng", roles: ["admin", "manager"] },
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
    <aside className="bg-[#112218] text-white p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto w-full lg:w-[280px] shrink-0">
      <div className="flex items-center gap-2.5 mb-4">
        <img src={logo} alt="" className="h-11 bg-white rounded-[10px] p-1" />
        <div className="min-w-0">
          <b className="block truncate">{fullName ?? "Quản trị"}</b>
          <small className="text-[#bdd7c2] block truncate">{email ?? ""}</small>
          {role && (
            <span className="inline-block mt-1 rounded-full bg-white/15 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
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
            className="w-full text-left rounded-xl px-3 py-2.5 font-extrabold text-[#dff5e3] hover:bg-white/10 hover:text-white"
            activeProps={{ className: "bg-white/15 text-white" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5 space-y-2">
        <button
          onClick={handleSignOut}
          className="block w-full text-center rounded-full bg-white/10 text-white border border-white/20 px-3 py-2 text-[13px] font-extrabold hover:bg-white/20"
        >
          Đăng xuất
        </button>
        <Link
          to="/"
          className="block text-center rounded-full bg-white text-brand-dark border border-hairline px-3 py-2 text-[13px] font-extrabold"
        >
          Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
