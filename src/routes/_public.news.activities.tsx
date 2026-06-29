import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/news/activities")({
  component: () => <Placeholder title="Hoạt động" />,
});
