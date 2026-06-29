import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/about/history")({
  component: () => <Placeholder title="Lịch sử phát triển" />,
});
