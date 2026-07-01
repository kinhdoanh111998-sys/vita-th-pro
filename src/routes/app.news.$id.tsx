import { createFileRoute } from "@tanstack/react-router";
import { NewsDetail } from "@/components/NewsDetail";

export const Route = createFileRoute("/app/news/$id")({
  component: () => {
    const { id } = Route.useParams();
    return (
      <div className="pt-4">
        <NewsDetail id={id} variant="mobile" backTo="/app/news" />
      </div>
    );
  },
});
