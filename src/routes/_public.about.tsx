import { Outlet, createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/about")({
  component: AboutLayout,
});

const TABS = [
  { to: "/about", label: "Tổng quan", exact: true },
  { to: "/about/history", label: "Lịch sử phát triển" },
  { to: "/about/team", label: "Đội ngũ chuyên gia" },
  { to: "/about/testimonials", label: "Khách hàng" },
  { to: "/about/certifications", label: "Chứng nhận" },
] as const;

function AboutLayout() {
  return (
    <div>
      <nav className="sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: t.exact ?? false }}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-brand-muted hover:bg-brand-soft hover:text-brand-dark transition"
                activeProps={{ className: "bg-brand text-white hover:bg-brand-dark hover:text-white" }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
