import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";

export const Route = createFileRoute("/admin/banners")({
  component: () => (
    <>
      <AdminTopbar title="Banner sự kiện" subtitle="Quản lý banner hiển thị trên trang chủ" />
      <div className="bg-white border border-hairline rounded-2xl p-10 text-center text-ink-muted font-bold">
        Bảng quản lý banner – UI demo. Logic sẽ được hoàn thiện ở giai đoạn sau.
      </div>
    </>
  ),
});
