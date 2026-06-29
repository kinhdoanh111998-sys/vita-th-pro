import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/about/team")({
  component: () => <Placeholder title="Đội ngũ" />,
});
