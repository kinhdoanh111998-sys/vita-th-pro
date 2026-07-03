import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Briefcase, ArrowRight, Home, CalendarCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { CustomerHomeContent } from "@/components/CustomerHomeContent";
import { ProfileForm } from "@/components/ProfileForm";
import { CustomerBookingDialog } from "@/components/CustomerBookingDialog";

export const Route = createFileRoute("/app/account")({
  component: AccountHub,
});


function AccountHub() {
  const { session, role, email, fullName, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="p-8 text-center text-brand-muted text-sm">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }
  if (!session) return null;

  async function handleSignOut() {
    try {
      await signOut();
      navigate({ to: "/login", replace: true });
    } catch {
      await supabase.auth.signOut();
      navigate({ to: "/login", replace: true });
    }
  }

  const isCustomer = role === "customer" || !role;
  const isStaff = role === "staff" || role === "employee" || role === "sale" || role === "technician";
  const isAdmin = role === "admin" || role === "manager";

  return (
    <div className="px-4 py-4 md:px-0 md:py-0 space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white grid place-items-center text-xl font-black">
            {(fullName ?? email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest text-ink-muted font-bold">Tài khoản</div>
            <div className="text-xl font-black text-brand-dark truncate">{fullName ?? email}</div>
            <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
              <span className="truncate">{email}</span>
              {role && (
                <span className="inline-flex items-center rounded-full bg-brand-soft text-brand-dark px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  {role}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" /> Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Role-based CTA */}
      {isStaff && (
        <div className="rounded-2xl border border-hairline bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 grid place-items-center text-emerald-700">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-brand-dark">Workspace Vận Hành</div>
              <div className="text-sm text-ink-muted mt-0.5">
                Chấm công, quản lý lịch hẹn, năng suất tháng và tiếp thị liên kết.
              </div>
            </div>
            <Link
              to="/portal/dashboard"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-brand text-white font-black hover:bg-brand-dark transition"
            >
              Vào Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-hairline bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 grid place-items-center text-indigo-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-black text-brand-dark">Hệ Thống Quản Trị Admin</div>
              <div className="text-sm text-ink-muted mt-0.5">
                Cấu hình toàn hệ thống, duyệt ca, quản trị người dùng, dữ liệu vận hành.
              </div>
            </div>
            <a
              href="/admin"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-indigo-600 text-white font-black hover:bg-indigo-700 transition"
            >
              Vào Admin <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/*
        Thứ tự mới theo yêu cầu:
        [1] Liệu trình của tôi (available + orders)
        [2] Tiếp thị liên kết
        [3] Hoa hồng của tôi + Đổi thưởng
        [4] Hồ sơ của tôi (áp chót)
        [5] Đổi mật khẩu (cuối) — cả 4 & 5 do ProfileForm render
      */}
      {isCustomer && <CustomerBookingCard />}
      {isCustomer && <CustomerHomeContent />}

      <ProfileForm />

      {/* Về trang chủ */}
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-dark hover:text-brand-primary"
        >
          <Home className="w-4 h-4" /> Về trang chủ Vita TH Pro
        </Link>
      </div>
    </div>
  );
}

