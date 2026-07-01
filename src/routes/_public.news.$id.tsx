import { createFileRoute } from "@tanstack/react-router";
import { NewsDetail } from "@/components/NewsDetail";

export const Route = createFileRoute("/_public/news/$id")({
  component: () => {
    const { id } = Route.useParams();
    return (
      <div className="bg-[#fafaf7] min-h-screen py-6">
        <NewsDetail id={id} backTo="/news" />
      </div>
    );
  },
});
