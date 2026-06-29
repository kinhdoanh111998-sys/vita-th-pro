import { createFileRoute } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/AdminTopbar";

const placeholders: Record<string, string> = {
  treatments: "Liệu trình khách hàng",
  orders: "Đơn hàng",
  tours: "Tour làm cho khách",
  commissions: "Hoa hồng / Trả thưởng",
  settings: "Cài đặt / Xuất dữ liệu",
};

export const Route = createFileRoute("/admin/$page")({
  component: PlaceholderPage,
});

function PlaceholderPage() {
  const { page } = Route.useParams();
  const title = placeholders[page] ?? page;
  return (
    <>
      <AdminTopbar title={title} subtitle="UI demo – chức năng sẽ bổ sung ở bước tiếp theo." />
      <div className="bg-white border border-hairline rounded-2xl p-10 text-center text-ink-muted font-bold">
        Khu vực <b className="text-brand-dark">{title}</b> đang được giữ chỗ trong khung giao
        diện. Bố cục đã sẵn sàng để gắn dữ liệu và logic xử lý.
      </div>
    </>
  );
}
