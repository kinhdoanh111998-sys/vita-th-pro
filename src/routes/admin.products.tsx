import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogView } from "@/components/AdminCatalogView";

export const Route = createFileRoute("/admin/products")({
  component: () => (
    <AdminCatalogView lockedType="product" title="Quản lý Sản phẩm" />
  ),
});
