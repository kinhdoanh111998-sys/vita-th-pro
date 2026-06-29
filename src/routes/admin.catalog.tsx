import { createFileRoute } from "@tanstack/react-router";
import { CrudAdminPage } from "@/components/CrudAdminPage";
import { money } from "@/lib/mockData";

export const Route = createFileRoute("/admin/catalog")({
  component: () => (
    <CrudAdminPage
      title="Sản phẩm / Dịch vụ"
      table="catalog"
      fields={[
        { name: "type", label: "Loại", required: true, placeholder: "Máy công nghệ / Dịch vụ" },
        { name: "name", label: "Tên", required: true },
        { name: "price", label: "Giá (VND)", type: "number", placeholder: "0 = liên hệ" },
        { name: "summary", label: "Mô tả ngắn", type: "textarea" },
        { name: "image", label: "Ảnh (URL)", type: "url" },
        { name: "source", label: "Nguồn" },
        { name: "status", label: "Trạng thái", placeholder: "Hiển thị" },
      ]}
      columns={[
        { key: "type", label: "Loại" },
        { key: "name", label: "Tên" },
        {
          key: "price",
          label: "Giá",
          render: (r) => (Number(r.price) > 0 ? money(Number(r.price)) : "Liên hệ"),
        },
        { key: "source", label: "Nguồn" },
        { key: "status", label: "Trạng thái" },
      ]}
    />
  ),
});
