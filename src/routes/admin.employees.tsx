import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { employees } from "@/lib/mockData";

export const Route = createFileRoute("/admin/employees")({
  component: EmployeesAdmin,
});

function EmployeesAdmin() {
  return (
    <>
      <AdminTopbar title="Nhân viên" />
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
          { key: "name", label: "Họ tên" },
          { key: "phone", label: "SĐT" },
          { key: "role", label: "Vai trò" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={employees}
      />
    </>
  );
}
