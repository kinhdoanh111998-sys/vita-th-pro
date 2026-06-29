import { createFileRoute } from "@tanstack/react-router";
import { PostList } from "@/components/PostList";
export const Route = createFileRoute("/_public/news/training")({
  component: () => (
    <PostList
      title="Lịch đào tạo"
      description="Lịch đào tạo vận hành, sản phẩm và chăm sóc khách hàng cho cơ sở chuyển giao."
      category="Đào tạo"
    />
  ),
});
