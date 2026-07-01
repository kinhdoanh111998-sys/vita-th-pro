import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/events")({
  component: () => <Placeholder title="Sự kiện" />,
});
