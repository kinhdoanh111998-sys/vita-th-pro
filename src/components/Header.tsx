import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import logo from "@/assets/vita-th-pro-logo.png";

const navGroups = [
  { label: "Trang chủ", href: "/" },
  {
    label: "Giới thiệu",
    href: "/",
    children: [
      { label: "Về chúng tôi", href: "/" },
      { label: "Lịch sử phát triển", href: "/" },
      { label: "Đội ngũ", href: "/" },
      { label: "Khách hàng nói về chúng tôi", href: "/" },
      { label: "Chứng nhận - chứng chỉ", href: "/" },
    ],
  },
  {
    label: "Tin tức",
    href: "/",
    children: [
      { label: "Hoạt động", href: "/" },
      { label: "Sự kiện", href: "/" },
      { label: "Lịch đào tạo", href: "/" },
    ],
  },
  {
    label: "Sản phẩm",
    href: "/",
    children: [
      { label: "Máy công nghệ", href: "/" },
      { label: "Phụ kiện", href: "/" },
      { label: "Dịch vụ", href: "/" },
      { label: "Chuyển giao công nghệ", href: "/" },
    ],
  },
  { label: "Liên hệ", href: "/" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-hairline">
      <div className="mx-auto max-w-[1180px] flex items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center min-w-[210px]">
          <img src={logo} alt="Vita TH Pro" className="h-[52px] w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navGroups.map((g) => (
            <div key={g.label} className="relative group">
              <Link
                to={g.href}
                className="flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-extrabold text-[#2e3a32] hover:bg-brand-soft hover:text-brand-dark"
                activeProps={{ className: "bg-brand-soft text-brand-dark" }}
                activeOptions={{ exact: true }}
              >
                {g.label}
                {g.children && <span className="text-[10px]">▾</span>}
              </Link>
              {g.children && (
                <div className="absolute left-0 top-11 min-w-[240px] bg-white border border-hairline rounded-[18px] p-2 shadow-[0_18px_46px_rgba(21,89,42,0.12)] hidden group-hover:block">
                  {g.children.map((c) => (
                    <Link
                      key={c.label}
                      to={c.href}
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
          <Button variant="secondary" size="sm">Tra cứu liệu trình</Button>
          <Button size="sm">Đặt lịch</Button>
          <Link
            to="/admin"
            className="rounded-full px-3 py-2 text-[13px] font-extrabold text-brand-dark hover:bg-brand-soft"
          >
            Quản trị
          </Link>
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
          {navGroups.flatMap((g) => [g, ...(g.children ?? [])]).map((item, i) => (
            <Link
              key={`${item.label}-${i}`}
              to={item.href}
              className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed]"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/admin"
            className="block px-5 py-3 text-sm font-extrabold border-b border-[#edf3ed] text-brand-dark"
            onClick={() => setOpen(false)}
          >
            Quản trị
          </Link>
        </div>
      )}
    </header>
  );
}
