import { createFileRoute } from "@tanstack/react-router";
import { CrudAdminPage } from "@/components/CrudAdminPage";

export const Route = createFileRoute("/admin/customers")({
  component: () => (
    <CrudAdminPage
      title="Khách hàng"
      table="customers"
      fields={[
        { name: "name", label: "Họ tên", required: true, placeholder: "Nguyễn Văn A" },
        { name: "phone", label: "Số điện thoại", required: true, placeholder: "0901xxxxxx" },
        { name: "source", label: "Nguồn", placeholder: "Website / Zalo / Nhân viên..." },
        { name: "note", label: "Ghi chú", type: "textarea" },
        { name: "status", label: "Trạng thái", placeholder: "Đang chăm sóc" },
      ]}
      columns={[
        { key: "name", label: "Họ tên" },
        { key: "phone", label: "SĐT" },
        { key: "source", label: "Nguồn" },
        { key: "note", label: "Ghi chú" },
        { key: "status", label: "Trạng thái" },
      ]}
    />
  ),
});
