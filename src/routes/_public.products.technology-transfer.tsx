import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/products/technology-transfer")({
  component: () => <Placeholder title="Chuyển giao công nghệ" />,
});
