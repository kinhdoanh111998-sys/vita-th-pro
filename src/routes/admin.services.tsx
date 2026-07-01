import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogView } from "@/components/AdminCatalogView";

export const Route = createFileRoute("/admin/services")({
  component: () => (
    <AdminCatalogView lockedType="service" title="Quản lý Dịch vụ" />
  ),
});
