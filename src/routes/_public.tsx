import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/Footer";
import { saveRef, logRefClick } from "@/lib/refTracker";


export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  const navigate = useNavigate();

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
    void navigate; // silence unused
  }, [navigate]);



  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Trang chủ (/) tự render header/footer riêng theo phong cách Luxury,
  // nên ẩn Header/Footer mặc định để tránh 2 thanh chồng nhau.
  const hideChrome = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {!hideChrome && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}
