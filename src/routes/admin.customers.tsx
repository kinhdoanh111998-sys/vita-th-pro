import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { customers } from "@/lib/mockData";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersAdmin,
});

function CustomersAdmin() {
  return (
    <>
      <AdminTopbar title="Khách hàng" subtitle={`${customers.length} khách trong hệ thống`} />
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
          { key: "name", label: "Họ tên" },
          { key: "phone", label: "SĐT" },
          { key: "source", label: "Nguồn" },
          { key: "note", label: "Ghi chú" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={customers}
      />
    </>
  );
}
