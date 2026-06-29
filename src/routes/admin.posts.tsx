import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { posts } from "@/lib/mockData";

export const Route = createFileRoute("/admin/posts")({
  component: () => (
    <>
      <AdminTopbar title="Tin tức / Hoạt động / Đào tạo" />
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
          { key: "category", label: "Chuyên mục" },
          { key: "title", label: "Tiêu đề" },
          { key: "date", label: "Ngày" },
        ]}
        rows={posts}
      />
    </>
  ),
});
