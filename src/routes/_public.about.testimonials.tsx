import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/about/testimonials")({
  component: () => <Placeholder title="Khách hàng nói về chúng tôi" />,
});
