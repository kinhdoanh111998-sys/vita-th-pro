import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Store, QrCode, Bell, User, LogIn } from "lucide-react";
import type { ComponentType } from "react";
import logo from "@/assets/vita-th-pro-logo.png";
import { useAuth } from "@/lib/AuthContext";

type NavItem = {
  to: "/app" | "/app/store" | "/app/scan" | "/app/notifications" | "/app/account";
  label: string;
  icon: ComponentType<{ className?: string }>;
  center?: boolean;
};

const NAV: NavItem[] = [
  { to: "/app", label: "Trang chủ", icon: Home },
  { to: "/app/store", label: "Cửa hàng", icon: Store },
  { to: "/app/scan", label: "Quét QR", icon: QrCode, center: true },
  { to: "/app/notifications", label: "Thông báo", icon: Bell },
  { to: "/app/account", label: "Tài khoản", icon: User },
];

export default function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Desktop top nav — replaces bottom nav on md+ */}
      <header className="hidden md:block sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-6 h-16">
          <Link to="/app" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="VITA" className="h-9 w-auto" />
            <span className="font-heading font-black text-emerald-700">
              VITA Community
            </span>
          </Link>
          <nav className="flex items-center gap-1 ml-6">
            {NAV.map((item) => {
              const active =
                item.to === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={
                    "inline-flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-semibold transition-colors " +
                    (active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50")
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/lookup"
              className="hidden lg:inline-flex items-center h-9 px-3 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 hover:border-emerald-500 hover:text-emerald-700"
            >
              Tra cứu liệu trình
            </Link>
            <Link
              to="/booking"
              className="inline-flex items-center h-9 px-3 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Đặt lịch
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-semibold border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] md:max-w-6xl md:px-6 pb-[80px] md:pb-12 md:pt-4">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-50">
        <div className="flex justify-between items-center px-4 pt-2 pb-3">
          {NAV.map((item) => {
            const active =
              item.to === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.to);
            const Icon = item.icon;

            if (item.center) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative -top-5 flex flex-col items-center gap-1"
                >
                  <span className="bg-brand-primary text-white rounded-full p-4 shadow-lg ring-4 ring-white">
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "flex flex-col items-center gap-1 py-1 min-w-[48px] " +
                  (active ? "text-brand-primary" : "text-gray-400")
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
