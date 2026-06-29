import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { catalog, money } from "@/lib/mockData";

export const Route = createFileRoute("/admin/catalog")({
  component: CatalogAdmin,
});

function CatalogAdmin() {
  return (
    <>
      <AdminTopbar title="Sản phẩm / Dịch vụ" subtitle={`${catalog.length} mục đang hiển thị`} />
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
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
        rows={catalog}
      />
    </>
  );
}
