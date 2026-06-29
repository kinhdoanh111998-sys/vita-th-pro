import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { bookings } from "@/lib/mockData";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsAdmin,
});

function BookingsAdmin() {
  return (
    <>
      <AdminTopbar title="Lịch hẹn" subtitle="Danh sách lịch hẹn đặt qua website & nhân viên" />
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
          { key: "customerName", label: "Khách hàng" },
          { key: "phone", label: "SĐT" },
          { key: "service", label: "Dịch vụ" },
          { key: "date", label: "Ngày" },
          { key: "time", label: "Giờ" },
          { key: "employee", label: "Nhân viên" },
          { key: "status", label: "Trạng thái" },
        ]}
        rows={bookings}
      />
    </>
  );
}
