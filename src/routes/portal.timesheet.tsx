import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/portal/timesheet")({
  component: TimesheetPage,
});

function TimesheetPage() {
  const { fullName, role } = useAuth();
  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="bg-white border border-hairline rounded-2xl p-8">
        <h1 className="text-2xl font-black text-brand-dark mb-2">
          Bảng công – Khu vực nội bộ
        </h1>
        <p className="text-ink-muted font-medium">
          Xin chào <b className="text-brand-dark">{fullName ?? "bạn"}</b> ({role}).
          Giao diện chấm công và theo dõi ca làm sẽ được phát triển ở bước tiếp theo.
        </p>
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          {["Ca hôm nay", "Tổng giờ tuần này", "Đơn xin nghỉ"].map((t) => (
            <div
              key={t}
              className="rounded-xl border border-hairline p-4 bg-[#f3f7f3]"
            >
              <div className="text-xs uppercase tracking-wider text-ink-muted font-bold">
                {t}
              </div>
              <div className="text-2xl font-black text-brand-dark mt-1">—</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
