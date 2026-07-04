import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { saveRef, logRefClick } from "@/lib/refTracker";
import { Link } from "@tanstack/react-router";
import { Home as HomeIcon, Store, User } from "lucide-react";


export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && ref.trim()) {
        const code = ref.trim().toUpperCase();
        const saved = saveRef(code, window.location.pathname);
        // Log click server-side (analytics)
        void logRefClick(code, window.location.pathname);
        // Legacy compat
        try { sessionStorage.setItem("vita_affiliate_ref", code); } catch { /* ignore */ }
        // Clean URL: xoá ?ref= khỏi thanh địa chỉ
        params.delete("ref");
        const newSearch = params.toString();
        const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
        window.history.replaceState({}, "", cleanUrl);
        void saved; // no-op; keep for readability
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
            {/* Public Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-3 h-16">
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-1 text-emerald-600"
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[11px] font-medium">Trang chủ</span>
          </Link>
          <Link
            to="/products"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <Store className="w-5 h-5" />
            <span className="text-[11px] font-medium">Cửa hàng</span>
          </Link>
          <Link
            to="/login"
            className="flex flex-col items-center justify-center gap-1 text-gray-500"
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] font-medium">Đăng nhập</span>
          </Link>
        </div>
      </nav>
      <FloatingActions />
    </div>
  );
}

