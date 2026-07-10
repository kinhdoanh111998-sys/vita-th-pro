import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths, endOfMonth, format, getDay, startOfMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

type StaffShift = {
  id: string;
  staff_id: string;
  date: string;
  shift_type: "sang" | "chieu" | "ca_ngay";
  status: string;
};

type StaffInfo = { id: string; full_name: string | null; email: string; role: string };

const shiftLabel = (t: string) =>
  t === "sang" ? "Ca Sáng" : t === "chieu" ? "Ca Chiều" : "Cả Ngày";
const shiftBadge = (t: string) =>
  t === "sang" ? "bg-amber-100 text-amber-800"
  : t === "chieu" ? "bg-sky-100 text-sky-800"
  : "bg-emerald-100 text-emerald-800";

function initials(name?: string | null, email?: string) {
  const s = (name || email || "?").trim();
  const parts = s.split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : s.slice(0, 2)).toUpperCase();
}

function avatarColor(id: string) {
  const palette = [
    "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500",
    "bg-teal-500", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-pink-500",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/** Buckets a calendar month into weeks × 7 (Mon..Sun); pads empty cells. */
function buildMonthGrid(anchor: Date) {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  // Mon=0..Sun=6
  const leading = (getDay(first) + 6) % 7;
  const days: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function StaffMonthCalendar() {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(() => format(new Date(), "yyyy-MM-dd"));
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const monthKey = format(anchor, "yyyy-MM");

  const q = useQuery({
    queryKey: ["staff-shifts-month", monthKey],
    queryFn: async () => {
      try {
        const from = format(startOfMonth(anchor), "yyyy-MM-dd");
        const to = format(endOfMonth(anchor), "yyyy-MM-dd");
        // Bao gồm cả ca đã duyệt VÀ các yêu cầu thay đổi đang chờ duyệt,
        // để Quản lý thấy được khi lịch tháng đã 'confirmed' nhưng có request lẻ.
        const { data: shifts, error } = await supabase
          .from("staff_shifts")
          .select("id,staff_id,date,shift_type,status")
          .gte("date", from)
          .lte("date", to)
          .in("status", ["approved", "pending"]);
        if (error) throw error;
        const ids = Array.from(new Set((shifts ?? []).map((s) => s.staff_id)));
        let usersMap: Record<string, StaffInfo> = {};
        if (ids.length) {
          const { data: users } = await supabase
            .from("users")
            .select("id,full_name,email,role")
            .in("id", ids);
          (users ?? []).forEach((u) => { usersMap[u.id] = u as StaffInfo; });
        }
        return { shifts: (shifts ?? []) as StaffShift[], users: usersMap };
      } catch (e) {
        console.error("[StaffMonthCalendar]", e);
        return { shifts: [] as StaffShift[], users: {} as Record<string, StaffInfo> };
      }
    },
  });

  const pendingCount = useMemo(
    () => (q.data?.shifts ?? []).filter((s) => s.status === "pending").length,
    [q.data],
  );

  const byDate = useMemo(() => {
    const m: Record<string, StaffShift[]> = {};
    (q.data?.shifts ?? []).forEach((s) => {
      (m[s.date] ??= []).push(s);
    });
    return m;
  }, [q.data]);

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-hairline">
        <div>
          <h3 className="font-black text-lg">Lịch Tháng · Toàn nhân viên</h3>
          <p className="text-xs text-ink-muted">
            {q.isLoading
              ? "Đang tải..."
              : `${(q.data?.shifts.length ?? 0) - pendingCount} ca đã duyệt${pendingCount > 0 ? ` · ${pendingCount} yêu cầu chờ duyệt` : ""}`}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="ml-3 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black animate-pulse">
            {pendingCount} yêu cầu thay đổi
          </span>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor((d) => addMonths(d, -1))}
            className="p-2 rounded-md hover:bg-brand-soft border border-hairline"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="min-w-[160px] text-center font-black text-brand-dark">
            {format(anchor, "'Tháng' M, yyyy", { locale: vi })}
          </div>
          <button
            onClick={() => setAnchor((d) => addMonths(d, 1))}
            className="p-2 rounded-md hover:bg-brand-soft border border-hairline"
            aria-label="Tháng sau"
          >
            <ChevronRight className="size-4" />
          </button>
          <Button variant="ghost" onClick={() => setAnchor(startOfMonth(new Date()))}>
            Hôm nay
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-hairline rounded-lg overflow-hidden">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`bg-brand-dark text-white text-center text-xs font-black py-2 ${i === 6 ? "text-red-300" : ""}`}
            >
              {w}
            </div>
          ))}
          <TooltipProvider delayDuration={100}>
            {grid.map((d, idx) => {
              if (!d) return <div key={idx} className="bg-gray-50 min-h-[90px]" />;
              const iso = format(d, "yyyy-MM-dd");
              const items = byDate[iso] ?? [];
              const isWeekend = idx % 7 >= 5;
              const isSelected = selectedDate === iso;
              return (
                <Tooltip key={idx} open={hoverDate === iso && items.length > 0 ? true : undefined}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      onMouseEnter={() => setHoverDate(iso)}
                      onMouseLeave={() => setHoverDate((h) => (h === iso ? null : h))}
                      className={`text-left bg-white min-h-[90px] p-1.5 flex flex-col transition ${items.some((i) => i.status === "pending") ? "bg-amber-50 ring-1 ring-amber-300 ring-inset" : items.length ? "bg-emerald-50/40" : ""} ${isSelected ? "ring-2 ring-brand-dark ring-inset" : "hover:bg-brand-soft/30"}`}
                    >
                      <div className={`text-xs font-bold ${isWeekend ? "text-red-600" : "text-ink"}`}>
                        {d.getDate()}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center -space-x-2">
                        {items.slice(0, 6).map((s) => {
                          const u = q.data?.users[s.staff_id];
                          const isPending = s.status === "pending";
                          return (
                            <div
                              key={s.id}
                              title={isPending ? "Yêu cầu thay đổi · Chờ duyệt" : undefined}
                              className={`size-7 rounded-full ring-2 grid place-items-center text-[10px] font-black text-white ${avatarColor(s.staff_id)} ${isPending ? "ring-amber-500" : "ring-white"}`}
                            >
                              {initials(u?.full_name, u?.email)}
                            </div>
                          );
                        })}
                        {items.length > 6 && (
                          <div className="size-7 rounded-full ring-2 ring-white grid place-items-center text-[10px] font-black text-white bg-gray-500">
                            +{items.length - 6}
                          </div>
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  {items.length > 0 && (
                    <TooltipContent className="bg-white text-ink border border-hairline shadow-md max-w-xs">
                      <div className="font-black mb-1">
                        {format(d, "EEEE, dd/MM/yyyy", { locale: vi })} · {items.length} nhân sự
                      </div>
                      <div className="space-y-1">
                        {items.map((s) => {
                          const u = q.data?.users[s.staff_id];
                          return (
                            <div key={s.id} className="flex items-center gap-2 text-xs">
                              <div className={`size-5 rounded-full grid place-items-center text-[9px] font-black text-white ${avatarColor(s.staff_id)}`}>
                                {initials(u?.full_name, u?.email)}
                              </div>
                              <span className="font-bold truncate max-w-[120px]">{u?.full_name ?? u?.email ?? "—"}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${shiftBadge(s.shift_type)}`}>
                                {shiftLabel(s.shift_type)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {selectedDate && (
          <div className="mt-4 border border-hairline rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-brand-soft/40 border-b border-hairline flex items-center justify-between">
              <div>
                <div className="font-black">
                  Chi tiết ngày {(() => { try { return format(new Date(selectedDate), "EEEE, dd/MM/yyyy", { locale: vi }); } catch { return selectedDate; } })()}
                </div>
                <div className="text-xs text-ink-muted">
                  {(byDate[selectedDate] ?? []).length} nhân sự có ca làm việc
                </div>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-xs text-ink-muted hover:text-ink">Đóng</button>
            </div>
            <div className="divide-y divide-hairline">
              {(byDate[selectedDate] ?? []).length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-ink-muted">Không có nhân sự nào làm ngày này.</div>
              ) : (
                (byDate[selectedDate] ?? []).map((s) => {
                  const u = q.data?.users[s.staff_id];
                  return (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`size-9 rounded-full grid place-items-center text-xs font-black text-white ${avatarColor(s.staff_id)}`}>
                        {initials(u?.full_name, u?.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{u?.full_name ?? u?.email ?? "—"}</div>
                        <div className="text-xs text-ink-muted truncate">{u?.email} · {u?.role ?? "—"}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${shiftBadge(s.shift_type)}`}>
                        {shiftLabel(s.shift_type)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 uppercase">{s.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
