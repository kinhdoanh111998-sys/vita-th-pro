import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/products/machines")({
  component: () => <Placeholder title="Máy công nghệ" />,
});
