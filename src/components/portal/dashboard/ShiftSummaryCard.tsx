import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, ListChecks, CalendarDays, Lock, Unlock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "@tanstack/react-router";
import { MIN_SHIFTS_FOR_OT } from "@/lib/payroll";

type Mode = "today" | "month";

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

export function ShiftSummaryCard() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const [mode, setMode] = useState<Mode>("today");
  const day = todayISO();
  const m = monthRange();

  const shiftsMapQ = useQuery({
    queryKey: ["portal-shift-summary-shifts"],
    queryFn: async () => {
      const { data } = await supabase.from("shifts").select("id, name, start_time, end_time");
      const map: Record<string, { name: string; start_time: string; end_time: string }> = {};
      (data ?? []).forEach((s: any) => {
        map[s.id] = { name: s.name, start_time: s.start_time, end_time: s.end_time };
      });
      return map;
    },
  });

  // Ca hôm nay
  const shiftsTodayQ = useQuery({
    queryKey: ["portal-shift-today", uid, day],
    enabled: !!uid && mode === "today",
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("shift_registrations")
          .select("id, shift_id, status")
          .eq("employee_id", uid!)
          .eq("date", day);
        if (error) throw error;
        return data ?? [];
      } catch (e) {
        console.warn("[ShiftSummaryCard] shifts today error", e);
        return [];
      }
    },
  });

  // Tours hôm nay
  const toursTodayQ = useQuery({
    queryKey: ["portal-tours-today", uid, day],
    enabled: !!uid && mode === "today",
    queryFn: async () => {
      try {
        const start = new Date(day + "T00:00:00").toISOString();
        const end = new Date(day + "T23:59:59.999").toISOString();
        const { data, error } = await supabase
          .from("tours")
          .select("id, status, staff_acceptance, start_time, customers(name), treatments(services(name))")
          .eq("technician_id", uid!)
          .or(`start_time.gte.${start},created_at.gte.${start}`)
          .lt("created_at", end);
        if (error) throw error;
        return data ?? [];
      } catch (e) {
        console.warn("[ShiftSummaryCard] tours today error", e);
        return [];
      }
    },
  });

  // Tháng: attendances đã checked-in (count distinct date)
  const attMonthQ = useQuery({
    queryKey: ["portal-att-month", uid, m.start],
    enabled: !!uid && mode === "month",
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("attendances")
          .select("date")
          .eq("employee_id", uid!)
          .gte("date", m.start)
          .lt("date", m.end);
        if (error) throw error;
        return new Set((data ?? []).map((r: any) => r.date)).size;
      } catch (e) {
        console.warn("[ShiftSummaryCard] att month error", e);
        return 0;
      }
    },
  });

  // Tháng: shift_registrations approved còn lại (date >= today)
  const shiftMonthQ = useQuery({
    queryKey: ["portal-shift-month", uid, m.start, day],
    enabled: !!uid && mode === "month",
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("shift_registrations")
          .select("id, status, date")
          .eq("employee_id", uid!)
          .gte("date", day)
          .lt("date", m.end);
        if (error) throw error;
        const approved = (data ?? []).filter((r: any) => r.status === "approved").length;
        const pending = (data ?? []).filter((r: any) => r.status === "pending").length;
        return { approved, pending, total: (data ?? []).length };
      } catch (e) {
        console.warn("[ShiftSummaryCard] shift month error", e);
        return { approved: 0, pending: 0, total: 0 };
      }
    },
  });

  // Tổng tour hoàn thành tháng
  const toursDoneMonthQ = useQuery({
    queryKey: ["portal-tours-done-month", uid, m.start],
    enabled: !!uid && mode === "month",
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from("tours")
          .select("id", { count: "exact", head: true })
          .eq("technician_id", uid!)
          .eq("status", "completed")
          .gte("created_at", m.startISO)
          .lt("created_at", m.endISO);
        if (error) throw error;
        return count ?? 0;
      } catch (e) {
        console.warn("[ShiftSummaryCard] tours done month error", e);
        return 0;
      }
    },
  });

  const shiftsMap = shiftsMapQ.data ?? {};

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-100 grid place-items-center text-blue-700">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark">Tóm tắt ca làm việc</h3>
          <p className="text-xs text-ink-muted">Lịch trình & tour của bạn.</p>
        </div>
        {/* Toggle */}
        <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("today")}
            className={
              "px-3 py-1 rounded-full transition " +
              (mode === "today" ? "bg-white shadow text-brand-dark" : "text-ink-muted")
            }
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setMode("month")}
            className={
              "px-3 py-1 rounded-full transition " +
              (mode === "month" ? "bg-white shadow text-brand-dark" : "text-ink-muted")
            }
          >
            Tháng
          </button>
        </div>
      </div>

      {mode === "today" ? (
        <div className="space-y-4">
          {/* Ca hôm nay */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Ca đăng ký hôm nay
            </div>
            {shiftsTodayQ.isLoading ? (
              <div className="text-xs text-ink-muted italic">Đang tải…</div>
            ) : (shiftsTodayQ.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-hairline p-3 text-xs text-center text-ink-muted italic">
                Không có ca nào hôm nay.
              </div>
            ) : (
              <div className="space-y-1.5">
                {(shiftsTodayQ.data ?? []).map((r: any) => {
                  const s = shiftsMap[r.shift_id];
                  const approved = r.status === "approved";
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl border border-hairline bg-[#fafcf7] px-3 py-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand/10 grid place-items-center text-brand-dark">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-ink">
                          {s?.name ?? "Ca"}{" "}
                          <span className="text-xs font-medium text-ink-muted">
                            ({s?.start_time?.slice(0, 5)}–{s?.end_time?.slice(0, 5)})
                          </span>
                        </div>
                      </div>
                      <span
                        className={
                          "text-[10px] px-2 py-0.5 rounded-full font-bold " +
                          (approved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800")
                        }
                      >
                        {approved ? "Đã duyệt" : r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tours hôm nay */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Tour phải làm hôm nay
            </div>
            {toursTodayQ.isLoading ? (
              <div className="text-xs text-ink-muted italic">Đang tải…</div>
            ) : (toursTodayQ.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-hairline p-3 text-xs text-center text-ink-muted italic">
                Chưa có tour nào cho hôm nay.
              </div>
            ) : (
              <div className="space-y-1.5">
                {(toursTodayQ.data ?? []).map((t: any) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-hairline bg-white px-3 py-2 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 grid place-items-center text-blue-700">
                      <ListChecks className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-ink truncate">
                        {t.customers?.name ?? "Khách hàng"}
                      </div>
                      <div className="text-[11px] text-ink-muted truncate">
                        {t.treatments?.services?.name ?? "Dịch vụ"}
                      </div>
                    </div>
                    <span
                      className={
                        "text-[10px] px-2 py-0.5 rounded-full font-bold " +
                        (t.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800")
                      }
                    >
                      {t.status ?? "assigned"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-1 text-right">
            <Link
              to="/portal/bookings"
              className="text-xs font-bold text-brand-dark hover:underline"
            >
              Xem tất cả tour của tôi →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {(() => {
            const shifts = Number(attMonthQ.data ?? 0);
            const unlocked = shifts >= MIN_SHIFTS_FOR_OT;
            const pct = Math.min(100, (shifts / MIN_SHIFTS_FOR_OT) * 100);
            return (
              <div
                className={
                  "mb-3 rounded-xl border p-3 flex items-center gap-3 " +
                  (unlocked
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50")
                }
              >
                <div
                  className={
                    "w-10 h-10 rounded-full grid place-items-center " +
                    (unlocked ? "bg-emerald-600 text-white" : "bg-amber-500 text-white")
                  }
                >
                  {unlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-ink">
                    {unlocked ? "Đã mở khoá KPI & OT" : "Chưa mở khoá KPI & OT"}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {shifts}/{MIN_SHIFTS_FOR_OT} ca đủ điều kiện tính lương OT
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
                    <div
                      className={
                        "h-full " + (unlocked ? "bg-emerald-500" : "bg-amber-500")
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Buổi công đã đi"
              value={attMonthQ.isLoading ? "…" : String(attMonthQ.data ?? 0)}
              hint="Ngày đã check-in tháng này"
              tone="emerald"
              icon={<Calendar className="w-4 h-4" />}
            />
            <Stat
              label="Ca đã duyệt còn lại"
              value={shiftMonthQ.isLoading ? "…" : String(shiftMonthQ.data?.approved ?? 0)}
              hint={`${shiftMonthQ.data?.pending ?? 0} ca chờ duyệt`}
              tone="blue"
              icon={<Clock className="w-4 h-4" />}
            />
            <Stat
              label="Tour hoàn thành"
              value={toursDoneMonthQ.isLoading ? "…" : String(toursDoneMonthQ.data ?? 0)}
              hint="Tour completed tháng này"
              tone="amber"
              icon={<ListChecks className="w-4 h-4" />}
            />
            <Stat
              label="Tổng ca tháng"
              value={shiftMonthQ.isLoading ? "…" : String(shiftMonthQ.data?.total ?? 0)}
              hint="Bao gồm cả pending"
              tone="slate"
              icon={<CalendarDays className="w-4 h-4" />}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label, value, hint, tone, icon,
}: {
  label: string; value: string; hint?: string;
  tone: "emerald" | "blue" | "amber" | "slate";
  icon: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <div className="rounded-xl border border-hairline bg-white p-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg border grid place-items-center ${tones[tone]}`}>
          {icon}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-ink-muted font-bold leading-tight">
          {label}
        </div>
      </div>
      <div className="mt-2 text-2xl font-black text-brand-dark">{value}</div>
      {hint && <div className="text-[10px] text-ink-muted mt-0.5">{hint}</div>}
    </div>
  );
}
