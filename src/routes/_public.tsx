import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
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
