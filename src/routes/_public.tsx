import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";


export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  // Nhiệm vụ 1: Bắt Affiliate Tracking toàn cục
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && ref.trim()) {
        sessionStorage.setItem("vita_affiliate_ref", ref.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  const { pathname } = useLocation();
  // Trang chủ (/) tự render Header cộng đồng riêng, ẩn Header mặc định để tránh trùng lặp.
  const hideDefaultHeader = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {!hideDefaultHeader && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

