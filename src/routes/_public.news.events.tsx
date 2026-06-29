import { createFileRoute } from "@tanstack/react-router";
import { PostList } from "@/components/PostList";
export const Route = createFileRoute("/_public/news/events")({
  component: () => (
    <PostList
      title="Sự kiện"
      description="Sự kiện trải nghiệm, hội thảo và chương trình ưu đãi của Vita TH Pro."
      category="Sự kiện"
    />
  ),
});
