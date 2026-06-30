import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import logo from "@/assets/vita-th-pro-logo.png";
import { useSettings } from "@/lib/useSettings";
import { useAuth } from "@/lib/AuthContext";

type NavItem = {
  label: string;
  to: string;
  search?: Record<string, string>;
};
type NavGroup = { label: string; to: string; children?: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Trang chủ", to: "/" },
  {
    label: "Giới thiệu",
    to: "/about",
    children: [
      { label: "Về chúng tôi", to: "/about" },
      { label: "Lịch sử phát triển", to: "/about/history" },
      { label: "Đội ngũ", to: "/about/team" },
      { label: "Khách hàng nói về chúng tôi", to: "/about/testimonials" },
      { label: "Chứng nhận - chứng chỉ", to: "/about/certifications" },
    ],
  },
  {
    label: "Tin tức",
    to: "/news",
    children: [
      { label: "Tất cả", to: "/news" },
      { label: "Hoạt động", to: "/news", search: { category: "Hoạt động" } },
      { label: "Sự kiện", to: "/news", search: { category: "Sự kiện" } },
      { label: "Lịch đào tạo", to: "/news", search: { category: "Lịch đào tạo" } },
    ],
  },
  {
    label: "Sản phẩm",
    to: "/products",
    children: [
      { label: "Tất cả", to: "/products" },
      { label: "Máy công nghệ", to: "/products", search: { category: "Máy công nghệ" } },
      { label: "Phụ kiện", to: "/products", search: { category: "Phụ kiện" } },
      { label: "Dịch vụ", to: "/products", search: { category: "Dịch vụ" } },
      { label: "Chuyển giao công nghệ", to: "/products", search: { category: "Chuyển giao công nghệ" } },
    ],
  },
  { label: "Liên hệ", to: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();
  const { session, role } = useAuth();
  const brand = settings?.brand ?? "Vita TH Pro";
  const hotline = settings?.hotline;

  const accountTo =
    role === "admin"
      ? "/admin"
      : role === "manager" || role === "staff" || role === "employee"
      ? "/portal/timesheet"
      : "/";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-hairline">
      <div className="mx-auto max-w-[1180px] flex items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-2 min-w-[210px]">
          <img src={logo} alt={brand} className="h-[52px] w-auto object-contain" />
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-black text-brand-dark text-sm">{brand}</span>
            {hotline && (
              <span className="text-[11px] font-bold text-ink-muted">
                Hotline: {hotline}
              </span>
            )}
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navGroups.map((g) => (
            <div key={g.label} className="relative group">
              <Link
                to={g.to}
                className="flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-extrabold text-[#2e3a32] hover:bg-brand-soft hover:text-brand-dark"
                activeProps={{ className: "bg-brand-soft text-brand-dark" }}
                activeOptions={{ exact: g.to === "/" }}
              >
                {g.label}
                {g.children && <span className="text-[10px]">▾</span>}
              </Link>
              {g.children && (
                <div className="absolute left-0 top-11 min-w-[240px] bg-white border border-hairline rounded-[18px] p-2 shadow-[0_18px_46px_rgba(21,89,42,0.12)] opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 z-50">
                  {g.children.map((c) => (
                    <Link
                      key={c.label}
                      to={c.to}
                      search={c.search as never}
                      className="block rounded-xl px-3 py-2.5 text-sm font-bold text-[#26352a] hover:bg-brand-soft hover:text-brand-dark"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link to="/lookup">
            <Button variant="secondary" size="sm">Tra cứu liệu trình</Button>
          </Link>
          <Link to="/booking">
            <Button size="sm">Đặt lịch</Button>
          </Link>
          {session ? (
            <Link
              to={accountTo}
              className="rounded-full px-3 py-2 text-[13px] font-extrabold text-brand-dark hover:bg-brand-soft"
            >
              Khu vực của tôi
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="secondary" size="sm">Đăng nhập</Button>
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden border border-hairline bg-white rounded-xl px-3 py-2"
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-hairline bg-white">
          {navGroups.flatMap((g) => [{ label: g.label, to: g.to, search: undefined as Record<string, string> | undefined }, ...((g.children ?? []) as NavItem[])]).map((item, i) => (
            <Link
              key={`${item.label}-${i}`}
              to={item.to}
              search={item.search as never}
              className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/booking"
            className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed]"
            onClick={() => setOpen(false)}
          >
            Đặt lịch
          </Link>
          <Link
            to="/lookup"
            className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed]"
            onClick={() => setOpen(false)}
          >
            Tra cứu liệu trình
          </Link>
          {session ? (
            <Link
              to={accountTo}
              className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed] text-brand-dark"
              onClick={() => setOpen(false)}
            >
              Khu vực của tôi
            </Link>
          ) : (
            <Link
              to="/login"
              className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed] text-brand-dark"
              onClick={() => setOpen(false)}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
