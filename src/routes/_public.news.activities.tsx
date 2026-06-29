import { createFileRoute } from "@tanstack/react-router";
import { PostList } from "@/components/PostList";
export const Route = createFileRoute("/_public/news/activities")({
  component: () => (
    <PostList
      title="Hoạt động"
      description="Hình ảnh và câu chuyện trải nghiệm công nghệ chăm sóc sức khỏe tại Vita TH Pro."
      category="Hoạt động"
    />
  ),
});
