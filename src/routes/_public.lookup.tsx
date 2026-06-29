import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/lookup")({
  component: () => <Placeholder title="Tra cứu liệu trình" />,
});
