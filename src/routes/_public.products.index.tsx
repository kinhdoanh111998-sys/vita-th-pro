import { createFileRoute } from "@tanstack/react-router";
import { PublicCatalogPage } from "@/components/PublicCatalogPage";

export const Route = createFileRoute("/_public/products/")({
  component: () => (
    <PublicCatalogPage
      kind="product"
      eyebrow="VITA TH Pro · Sản phẩm"
      title="Sản phẩm chính hãng"
      subtitle="Máy công nghệ, phụ kiện và thực dưỡng — nâng tầm chăm sóc sức khoẻ và sắc đẹp mỗi ngày."
    />
  ),
});
