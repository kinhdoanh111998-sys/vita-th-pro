import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { bookings, kpis } from "@/lib/mockData";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <AdminTopbar title="Dashboard" subtitle="Tổng quan vận hành hôm nay" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-hairline rounded-[18px] p-4">
            <b className="block text-[27px] text-brand-dark">{k.value}</b>
            <span className="text-sm text-ink-muted font-bold">{k.label}</span>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-black mb-3">Lịch hẹn sắp tới</h2>
      <DataTable
        columns={[
          { key: "id", label: "Mã" },
          { key: "customerName", label: "Khách hàng" },
          { key: "phone", label: "SĐT" },
          { key: "service", label: "Dịch vụ" },
          { key: "date", label: "Ngày" },
          { key: "time", label: "Giờ" },
          { key: "employee", label: "Nhân viên" },
          {
            key: "status",
            label: "Trạng thái",
            render: (r) => <StatusPill value={String(r.status)} />,
          },
        ]}
        rows={bookings}
      />
    </>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "Đã xác nhận"
      ? "bg-[#e8f8ea] text-brand-deep"
      : value === "Chờ xác nhận"
        ? "bg-[#fff6d7] text-[#6a4c00]"
        : "bg-[#f8e7e7] text-destructive";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>
      {value}
    </span>
  );
}
