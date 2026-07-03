import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogView } from "@/components/AdminCatalogView";
import { AdminCombosView } from "@/components/AdminCombosView";

type Tab = "services" | "combos";

function AdminServicesPage() {
  const [tab, setTab] = useState<Tab>("services");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-brand-border">
        <TabBtn active={tab === "services"} onClick={() => setTab("services")}>
          Dịch vụ & Sản phẩm
        </TabBtn>
        <TabBtn active={tab === "combos"} onClick={() => setTab("combos")}>
          Combo đóng gói
        </TabBtn>
      </div>
      {tab === "services" ? (
        <AdminCatalogView lockedType="service" title="Quản lý Dịch vụ" />
      ) : (
        <AdminCombosView />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? "border-brand-primary text-brand-primary-dark"
          : "border-transparent text-brand-muted hover:text-brand-text"
      }`}
    >
      {children}
    </button>
  );
}

export const Route = createFileRoute("/admin/services")({
  component: AdminServicesPage,
});
