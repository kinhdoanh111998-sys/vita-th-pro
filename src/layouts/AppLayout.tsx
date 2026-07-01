import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Store, QrCode, Bell, User } from "lucide-react";
import type { ComponentType } from "react";

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
      <main className="mx-auto max-w-[480px] pb-[80px]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-50">
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
