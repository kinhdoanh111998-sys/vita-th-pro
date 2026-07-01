import { createFileRoute } from "@tanstack/react-router";
import { EventDetail } from "@/components/EventDetail";

export const Route = createFileRoute("/_public/events/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <EventDetail id={id} />;
  },
});
