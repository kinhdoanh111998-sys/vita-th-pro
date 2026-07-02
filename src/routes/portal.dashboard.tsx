import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthContext";
import { AttendanceWidget, ShiftRegistrationPanel } from "@/components/AttendanceWidget";
import { StaffScheduleRegistration } from "@/components/StaffScheduleRegistration";
import { AffiliateCard } from "@/components/portal/dashboard/AffiliateCard";
import { PerformanceCard } from "@/components/portal/dashboard/PerformanceCard";
import { ShiftSummaryCard } from "@/components/portal/dashboard/ShiftSummaryCard";

export const Route = createFileRoute("/portal/dashboard")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const { fullName, role } = useAuth();

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      {/* Header */}
      <div className="bg-white border border-hairline rounded-2xl p-6">
        <div className="text-xs uppercase tracking-wider text-ink-muted font-bold">
          Xin chào {role}
        </div>
        <h1 className="text-2xl font-black text-brand-dark mt-1">
          {fullName ?? "Nhân viên"} – Bảng điều khiển
        </h1>
        <p className="text-ink-muted font-medium text-sm mt-1">
          Chấm công, theo dõi năng suất và chia sẻ link tiếp thị của bạn.
        </p>
      </div>

      {/* KHỐI CHẤM CÔNG */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceWidget />
        <ShiftRegistrationPanel />
      </div>

      {/* 3 THẺ TIỆN ÍCH MỚI */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ShiftSummaryCard />
        <PerformanceCard />
      </div>
      <AffiliateCard />

      {/* ĐĂNG KÝ LỊCH THÁNG */}
      <StaffScheduleRegistration />
    </div>
  );
}
