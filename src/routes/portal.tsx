import { Outlet, createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

type NotificationRow = {
  id: string;
  recipient_id: string | null;
  type: string | null;
  title: string | null;
  body: string | null;
  ref_type: string | null;
  ref_id: string | null;
};

function PortalLayout() {
  const { pathname } = useLocation();
  const isCustomerPage = pathname === "/portal/my-treatments" || pathname === "/portal/affiliate";
  const allowedRoles = isCustomerPage
    ? (["admin", "manager", "staff", "employee", "sale", "technician", "customer"] as const)
    : (["admin", "manager", "staff", "employee", "sale", "technician"] as const);

  return (
    <AuthGuard allowedRoles={[...allowedRoles]}>
      <PortalShell />
    </AuthGuard>
  );
}

const STAFF_NAV = [
  { to: "/portal/dashboard", label: "Dashboard" },
  { to: "/portal/bookings", label: "Lịch hẹn" },
  { to: "/portal/contacts", label: "Khách hàng liên hệ" },
  // Tạm ẩn theo Phase 1: /portal/timesheet & /portal/content
] as const;

const CUSTOMER_NAV = [
  { to: "/portal/my-treatments", label: "Liệu trình của tôi" },
  { to: "/portal/affiliate", label: "Tiếp thị liên kết" },
] as const;

function PortalShell() {
  const { session, fullName, email, role, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const uid = session?.user?.id ?? null;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  // Realtime: listen for INSERT on notifications where recipient_id = uid
  useEffect(() => {
    if (!uid) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`notif-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${uid}`,
          },
          (payload) => {
            const n = payload.new as NotificationRow;
            const title = n.title ?? "Thông báo mới";
            const desc = n.body ?? "";
            const isTour = n.type === "tour_assignment" && n.ref_id;

            qc.invalidateQueries({ queryKey: ["portal", "my-tours", uid] });

            if (isTour) {
              toast(title, {
                description: desc,
                duration: 12000,
                action: {
                  label: "Xác nhận",
                  onClick: async () => {
                    try {
                      const { error } = await supabase
                        .from("tours")
                        .update({ staff_acceptance: "accepted" })
                        .eq("id", n.ref_id!);
                      if (error) throw error;
                      toast.success("Đã nhận ca ✓");
                      qc.invalidateQueries({ queryKey: ["portal", "my-tours", uid] });
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Lỗi cập nhật";
                      toast.error(msg);
                    }
                  },
                },
                cancel: {
                  label: "Xem",
                  onClick: () => navigate({ to: "/portal/bookings" }),
                },
              });
            } else {
              toast(title, { description: desc });
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.error("[portal] realtime subscribe failed:", err);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [uid, qc, navigate]);


  const NAV = role === "customer" ? CUSTOMER_NAV : STAFF_NAV;
  const homeTo = role === "customer" ? "/portal/my-treatments" : "/portal/dashboard";

  return (
    <div className="min-h-screen bg-[#f3f7f3] flex flex-col">
      <header className="bg-[#112218] text-white">
        <div className="mx-auto max-w-[1180px] flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
          {/* Mobile: hamburger + brand */}
          <div className="flex items-center gap-3 md:hidden min-w-0">
            <MobilePortalMenu
              nav={NAV}
              homeTo={homeTo}
              role={role}
              onSignOut={handleSignOut}
            />
            <Link to={homeTo} className="font-black text-base truncate">
              {role === "customer" ? "Khu vực Khách hàng" : "Khu vực Quản lý"}
            </Link>
          </div>

          {/* Desktop: original layout untouched */}
          <div className="hidden md:flex items-center gap-4">
            <Link to={homeTo} className="font-black text-lg">
              {role === "customer" ? "Khu vực Khách hàng" : "Khu vực Quản lý"}
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
          <div className="hidden md:flex items-center gap-3 text-sm">
            <Link
              to="/app/account"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-extrabold hover:bg-white/20"
              title="Hồ sơ của tôi"
            >
              👤 Hồ sơ
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-extrabold hover:bg-white/20"
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

          {/* Mobile: compact identity */}
          <div className="md:hidden text-right leading-tight text-xs min-w-0">
            <div className="font-bold truncate max-w-[140px]">{fullName ?? email}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/70">{role}</div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 lg:p-7">
        <Outlet />
      </main>
    </div>
  );
}

function MobilePortalMenu({
  nav,
  homeTo,
  role,
  onSignOut,
}: {
  nav: ReadonlyArray<{ to: string; label: string }>;
  homeTo: string;
  role: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Mở menu"
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86%] max-w-[320px] bg-[#112218] text-white border-0 p-0">
        <div className="p-4 border-b border-white/10">
          <div className="font-black text-lg">
            {role === "customer" ? "Khu vực Khách hàng" : "Khu vực Quản lý"}
          </div>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-white/10"
              activeProps={{ className: "bg-white/15" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 mt-2 border-t border-white/10 space-y-2">
          <Link
            to="/app/account"
            onClick={() => setOpen(false)}
            className="block text-center rounded-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-extrabold hover:bg-white/20"
          >
            👤 Hồ sơ của tôi
          </Link>
          <Link
            to={homeTo}
            onClick={() => setOpen(false)}
            className="block text-center rounded-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-extrabold hover:bg-white/20"
          >
            📊 Dashboard
          </Link>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block text-center rounded-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-extrabold hover:bg-white/20"
          >
            🏠 Trở về Trang chủ
          </Link>
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="block w-full text-center rounded-full bg-white text-[#112218] px-3 py-2 text-xs font-extrabold hover:bg-white/90"
          >
            Đăng xuất
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
