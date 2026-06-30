import { Outlet, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <AuthGuard allowedRoles={["admin", "manager", "staff"]}>
      <PortalShell />
    </AuthGuard>
  );
}

const NAV = [
  { to: "/portal/dashboard", label: "Dashboard" },
  { to: "/portal/bookings", label: "Lịch hẹn" },
  { to: "/portal/timesheet", label: "Bảng công" },
  { to: "/portal/content", label: "Viết bài" },
] as const;

function PortalShell() {
  const { fullName, email, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f3f7f3] flex flex-col">
      <header className="bg-[#112218] text-white">
        <div className="mx-auto max-w-[1180px] flex items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-4">
            <Link to="/portal/dashboard" className="font-black text-lg">
              Khu vực Quản lý
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="rounded-full px-3 py-1.5 text-sm font-bold hover:bg-white/10"
                  activeProps={{ className: "bg-white/15" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-extrabold hover:bg-white/20"
            >
              🏠 Trở về Trang chủ
            </Link>
            <div className="text-right leading-tight">
              <div className="font-bold">{fullName ?? email}</div>
              <div className="text-[11px] uppercase tracking-wider text-white/70">
                {role}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-extrabold hover:bg-white/20"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-5 lg:p-7">
        <Outlet />
      </main>
    </div>
  );
}
