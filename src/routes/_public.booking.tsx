import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/booking")({
  component: () => <Placeholder title="Đặt lịch" />,
});
