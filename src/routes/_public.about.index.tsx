import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";
export const Route = createFileRoute("/_public/about/")({
  component: () => <Placeholder title="Về chúng tôi" />,
});
