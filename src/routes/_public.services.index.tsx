import { createFileRoute } from "@tanstack/react-router";
import { PublicCatalogPage } from "@/components/PublicCatalogPage";

export const Route = createFileRoute("/_public/services/")({
  component: () => (
    <PublicCatalogPage
      kind="service"
      eyebrow="VITA TH Pro · Dịch vụ"
      title="Dịch vụ & Liệu trình"
      subtitle="Các gói liệu trình chuyên sâu, thiết kế bởi đội ngũ chuyên gia VITA TH Pro."
    />
  ),
});
