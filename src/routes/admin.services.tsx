import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogView } from "@/components/AdminCatalogView";
import { AdminCombosView } from "@/components/AdminCombosView";

type Tab = "services" | "combos";

function AdminServicesPage() {
  const [tab, setTab] = useState<Tab>("services");
  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-4 md:px-6 pt-4">
        <div className="flex gap-2">
          <TabBtn active={tab === "services"} onClick={() => setTab("services")}>
            Dịch vụ & Sản phẩm
          </TabBtn>
          <TabBtn active={tab === "combos"} onClick={() => setTab("combos")}>
            Combo đóng gói
          </TabBtn>
        </div>
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
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

export const Route = createFileRoute("/admin/services")({
  component: AdminServicesPage,
});
