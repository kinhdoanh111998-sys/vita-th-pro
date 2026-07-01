import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, Menu, Search, X } from "lucide-react";
import logo from "@/assets/vita-th-pro-logo.png";
import { useSettings } from "@/lib/useSettings";
import { useSystemSettings } from "@/lib/useSystemSettings";
import { useAuth } from "@/lib/AuthContext";

const navLinks = [
  { label: "Trang chủ", to: "/" as const },
  { label: "Giới thiệu", to: "/about" as const },
  { label: "Sản phẩm & Dịch vụ", to: "/products" as const },
  { label: "Sự kiện", to: "/events" as const },
  { label: "Cộng đồng", to: "/community" as const },
  { label: "Tin tức", to: "/news" as const },
  { label: "Liên hệ", to: "/contact" as const },
];

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: settings } = useSettings();
  const { data: sys } = useSystemSettings();
  const { session, role } = useAuth();
  const brand = settings?.brand ?? "Vita TH Pro";
  const hotline = sys?.hotline ?? settings?.hotline ?? "0988 000 888";

  const accountTo =
    role === "admin"
      ? "/admin"
      : role === "manager" || role === "staff" || role === "employee"
        ? "/portal/timesheet"
        : role === "customer"
          ? "/portal/my-treatments"
          : "/login";

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-white border-b"
        style={{ borderColor: "#E3E3E3" }}
      >
        <div className="w-full flex items-center gap-3 px-4 md:px-12 py-2.5 md:py-3">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src={logo}
              alt={brand}
              className="h-11 md:h-12 w-auto object-contain"
            />
            <div className="hidden md:flex flex-col leading-tight">
              <span
                className="font-heading font-black text-[15px]"
                style={{ color: "#147805" }}
              >
                {brand}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: "#929292" }}
              >
                Hotline: {hotline}
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 ml-4 xl:ml-6">
            {navLinks.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-2.5 py-2 rounded-lg text-[13.5px] font-semibold whitespace-nowrap transition-colors hover:bg-[#D9F0D6] hover:text-[#147805]"
                style={{ color: "#484848" }}
                activeProps={{
                  style: { color: "#1B9606", backgroundColor: "#D9F0D6" },
                }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/lookup"
              className="hidden xl:inline-flex items-center h-10 px-3 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-[#D9F0D6] hover:text-[#147805] hover:border-[#1B9606]"
              style={{ borderColor: "#E3E3E3", color: "#484848" }}
            >
              Tra cứu liệu trình
            </Link>
            <Link
              to="/booking"
              className="hidden md:inline-flex items-center h-10 px-3 lg:px-4 rounded-lg text-[13px] font-semibold text-white transition-colors"
              style={{ backgroundColor: "#1B9606" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#147805")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#1B9606")
              }
            >
              Đặt lịch
            </Link>

            {session ? (
              <Link
                to={accountTo}
                className="inline-flex items-center h-10 px-3 md:px-4 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-[#D9F0D6] hover:border-[#1B9606] hover:text-[#147805]"
                style={{ borderColor: "#1B9606", color: "#1B9606" }}
              >
                Khu vực của tôi
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 h-10 px-3 md:px-4 rounded-lg text-[13px] font-semibold border transition-colors hover:bg-[#D9F0D6] hover:border-[#1B9606] hover:text-[#147805]"
                style={{ borderColor: "#1B9606", color: "#1B9606" }}
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border"
              style={{ borderColor: "#E3E3E3", color: "#484848" }}
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-[82%] max-w-[320px] bg-white shadow-xl flex flex-col">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#E3E3E3" }}
            >
              <img src={logo} alt={brand} className="h-9 w-auto" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-9 w-9 rounded-lg inline-flex items-center justify-center"
                style={{ color: "#484848" }}
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3">
              <div
                className="flex items-center gap-2 bg-[#FAFAFA] rounded-lg px-3 py-2 border"
                style={{ borderColor: "#E3E3E3" }}
              >
                <Search className="w-4 h-4" style={{ color: "#929292" }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#484848" }}
                />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-2">
              {navLinks.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setDrawerOpen(false)}
                  className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                  style={{ color: "#484848" }}
                  activeProps={{
                    style: { color: "#1B9606", backgroundColor: "#D9F0D6" },
                  }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
              <div
                className="h-px my-2"
                style={{ backgroundColor: "#E3E3E3" }}
              />
              <Link
                to="/lookup"
                onClick={() => setDrawerOpen(false)}
                className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                style={{ color: "#484848" }}
              >
                Tra cứu liệu trình
              </Link>
              <Link
                to="/booking"
                onClick={() => setDrawerOpen(false)}
                className="block px-3 py-3 rounded-lg text-[15px] font-semibold hover:bg-[#D9F0D6]"
                style={{ color: "#484848" }}
              >
                Đặt lịch
              </Link>
            </nav>

            <div
              className="px-4 py-3 border-t"
              style={{ borderColor: "#E3E3E3" }}
            >
              <Link
                to="/booking"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center h-11 rounded-lg text-white text-[14px] font-semibold"
                style={{ backgroundColor: "#1B9606" }}
              >
                Đặt lịch ngay
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
