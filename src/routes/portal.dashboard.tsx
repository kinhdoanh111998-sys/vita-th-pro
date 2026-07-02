import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users2, ClipboardList } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { AttendanceWidget, ShiftRegistrationPanel } from "@/components/AttendanceWidget";
import { StaffScheduleRegistration } from "@/components/StaffScheduleRegistration";

export const Route = createFileRoute("/portal/dashboard")({
  component: PortalDashboard,
});


function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startISO: start.toISOString(), endISO: end.toISOString(), day: start.toISOString().slice(0, 10) };
}

function PortalDashboard() {
  const { fullName, role } = useAuth();
  const { day, startISO, endISO } = todayRange();

  const bookingsToday = useQuery({
    queryKey: ["portal", "bookings-today", day],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_date", day);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const toursToday = useQuery({
    queryKey: ["portal", "tours-today", day],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tours")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startISO)
        .lt("created_at", endISO);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const pendingBookings = useQuery({
    queryKey: ["portal", "bookings-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div className="bg-white border border-hairline rounded-2xl p-6">
        <div className="text-xs uppercase tracking-wider text-ink-muted font-bold">
          Xin chào {role}
        </div>
        <h1 className="text-2xl font-black text-brand-dark mt-1">
          {fullName ?? "Quản lý"} – Tổng quan hôm nay
        </h1>
        <p className="text-ink-muted font-medium text-sm mt-1">
          Nắm bắt nhanh lịch hẹn và ca làm trong ngày để điều phối kịp thời.
        </p>
      </div>

      {/* ==== KHỐI CHẤM CÔNG & ĐĂNG KÝ CA (Mobile-first) ==== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AttendanceWidget />
        <ShiftRegistrationPanel />
      </div>

      {/* ==== ĐĂNG KÝ LỊCH THÁNG (Tuần mẫu → nhân bản → lưu) ==== */}
      <StaffScheduleRegistration />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="Lịch hẹn hôm nay"
          value={bookingsToday.data ?? "—"}
          loading={bookingsToday.isLoading}
          hint={`Ngày ${day}`}
          tone="emerald"
        />
        <StatCard
          icon={<Users2 className="size-5" />}
          label="Ca làm hôm nay"
          value={toursToday.data ?? "—"}
          loading={toursToday.isLoading}
          hint="Tổng tour đã tạo trong hôm nay"
          tone="blue"
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Lịch hẹn chờ điều phối"
          value={pendingBookings.data ?? "—"}
          loading={pendingBookings.isLoading}
          hint="Trạng thái pending"
          tone="amber"
        />
      </div>

      <div className="bg-white border border-hairline rounded-2xl p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-brand-dark">Điều phối lịch hẹn</h2>
          <p className="text-sm text-ink-muted">
            Mở danh sách lịch hẹn đang chờ và gán Kỹ thuật viên + Liệu trình.
          </p>
        </div>
        <Link
          to="/portal/bookings"
          className="inline-flex items-center gap-2 rounded-full bg-brand text-white px-4 py-2 text-sm font-extrabold hover:bg-brand-dark"
        >
          Vào trang Lịch hẹn →
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  loading,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  loading?: boolean;
  tone: "emerald" | "blue" | "amber";
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className="bg-white border border-hairline rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`size-10 grid place-items-center rounded-xl border ${tones[tone]}`}>
          {icon}
        </div>
        <div className="text-xs uppercase tracking-wider text-ink-muted font-bold">
          {label}
        </div>
      </div>
      <div className="mt-4 text-3xl font-black text-brand-dark">
        {loading ? "…" : value}
      </div>
      {hint && <div className="text-xs text-ink-muted mt-1">{hint}</div>}
    </div>
  );
}
