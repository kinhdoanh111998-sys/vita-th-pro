import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/products/services")({
  component: () => <Placeholder title="Dịch vụ" />,
});
