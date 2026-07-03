import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { saveRef, logRefClick } from "@/lib/refTracker";


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
      <FloatingActions />
    </div>
  );
}

