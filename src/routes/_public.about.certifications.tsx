import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/about/certifications")({
  component: () => <Placeholder title="Chứng nhận - chứng chỉ" />,
});
