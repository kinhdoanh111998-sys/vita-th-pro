import { createFileRoute } from "@tanstack/react-router";
import { CrudAdminPage } from "@/components/CrudAdminPage";

export const Route = createFileRoute("/admin/banners")({
  component: () => (
    <CrudAdminPage
      title="Banner sự kiện"
      table="banners"
      fields={[
        { name: "title", label: "Tiêu đề", required: true },
        { name: "subtitle", label: "Mô tả", type: "textarea" },
        { name: "type", label: "Loại", placeholder: "Sự kiện / Ưu đãi / Đào tạo" },
        { name: "cta", label: "Nút hành động (CTA)", placeholder: "Đặt lịch ngay" },
        { name: "image", label: "Ảnh (URL)", type: "url" },
      ]}
      columns={[
        { key: "title", label: "Tiêu đề" },
        { key: "type", label: "Loại" },
        { key: "cta", label: "CTA" },
        {
          key: "image",
          label: "Ảnh",
          render: (r) =>
            r.image ? (
              <img
                src={String(r.image)}
                alt=""
                className="h-12 w-20 object-cover rounded-md border border-hairline"
              />
            ) : (
              "—"
            ),
        },
      ]}
    />
  ),
});
