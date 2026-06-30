import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/portal/timesheet")({
  component: TimesheetPage,
});

function todayStr() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

type TimesheetRow = {
  id: string;
  staff_id: string;
  work_date: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string | null;
};

function TimesheetPage() {
  const { fullName, email, role } = useAuth();
  const qc = useQueryClient();
  const today = todayStr();

  // Resolve staff_id from users table by email
  const me = useQuery({
    queryKey: ["portal", "me", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; full_name: string | null; email: string } | null;
    },
  });
  const staffId = me.data?.id ?? null;

  const todayTs = useQuery({
    queryKey: ["portal", "timesheet", "today", staffId, today],
    enabled: !!staffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*")
        .eq("staff_id", staffId!)
        .eq("work_date", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as TimesheetRow | null;
    },
  });

  const history = useQuery({
    queryKey: ["portal", "timesheet", "history", staffId],
    enabled: !!staffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*")
        .eq("staff_id", staffId!)
        .order("work_date", { ascending: false })
        .limit(7);
      if (error) throw error;
      return (data ?? []) as TimesheetRow[];
    },
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      if (!staffId) throw new Error("Không xác định được nhân viên");
      const { error } = await supabase.from("timesheets").insert({
        staff_id: staffId,
        work_date: today,
        check_in_time: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã vào ca. Chúc bạn làm việc hiệu quả!");
      qc.invalidateQueries({ queryKey: ["portal", "timesheet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      const row = todayTs.data;
      if (!row) throw new Error("Chưa có ca để tan");
      const { error } = await supabase
        .from("timesheets")
        .update({ check_out_time: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã tan ca. Cảm ơn bạn!");
      qc.invalidateQueries({ queryKey: ["portal", "timesheet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const row = todayTs.data;
  const status: "none" | "in" | "done" = !row
    ? "none"
    : row.check_out_time
      ? "done"
      : "in";

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div className="bg-white border border-hairline rounded-2xl p-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-brand-dark mb-1">Bảng công hôm nay</h1>
            <p className="text-ink-muted font-medium">
              Xin chào <b className="text-brand-dark">{fullName ?? email}</b>{role ? ` (${role})` : ""} — {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl border border-hairline px-4 py-2 bg-[#f3f7f3]">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">Vào ca</div>
              <div className="font-black text-brand-dark">{fmt(row?.check_in_time ?? null)}</div>
            </div>
            <div className="rounded-xl border border-hairline px-4 py-2 bg-[#f3f7f3]">
              <div className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">Tan ca</div>
              <div className="font-black text-brand-dark">{fmt(row?.check_out_time ?? null)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center py-10 border-t border-hairline">
          {!staffId && me.isFetched ? (
            <div className="text-sm text-red-600 font-bold">
              Tài khoản của bạn chưa được liên kết trong bảng nhân viên (users). Vui lòng liên hệ Quản lý.
            </div>
          ) : status === "none" ? (
            <button
              onClick={() => checkIn.mutate()}
              disabled={checkIn.isPending || !staffId}
              className="group flex flex-col items-center justify-center w-56 h-56 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-16 h-16 mb-2" />
              <span className="text-2xl font-black">VÀO CA</span>
              <span className="text-xs opacity-80 mt-1">Check-in</span>
            </button>
          ) : status === "in" ? (
            <button
              onClick={() => checkOut.mutate()}
              disabled={checkOut.isPending}
              className="group flex flex-col items-center justify-center w-56 h-56 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
              <LogOut className="w-16 h-16 mb-2" />
              <span className="text-2xl font-black">TAN CA</span>
              <span className="text-xs opacity-80 mt-1">Check-out</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center w-56 h-56 rounded-full bg-[#f3f7f3] border-2 border-dashed border-hairline text-brand-dark">
              <CheckCircle2 className="w-16 h-16 mb-2 text-emerald-600" />
              <span className="text-base font-black text-center px-4">Đã hoàn thành<br/>ca hôm nay</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-hairline rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-brand-dark" />
          <h2 className="text-lg font-black text-brand-dark">Lịch sử 7 ngày gần nhất</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f3f7f3] text-left">
              <tr>
                <th className="px-3 py-2 font-bold">Ngày</th>
                <th className="px-3 py-2 font-bold">Vào ca</th>
                <th className="px-3 py-2 font-bold">Tan ca</th>
                <th className="px-3 py-2 font-bold">Tổng giờ</th>
                <th className="px-3 py-2 font-bold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {history.isLoading && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-muted">Đang tải...</td></tr>
              )}
              {history.data?.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-muted">Chưa có dữ liệu chấm công</td></tr>
              )}
              {history.data?.map((r) => {
                const hours =
                  r.check_in_time && r.check_out_time
                    ? ((new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime()) / 3600000).toFixed(2)
                    : "—";
                return (
                  <tr key={r.id} className="border-t border-hairline">
                    <td className="px-3 py-2 font-medium">{fmtDate(r.work_date)}</td>
                    <td className="px-3 py-2">{fmt(r.check_in_time)}</td>
                    <td className="px-3 py-2">{fmt(r.check_out_time)}</td>
                    <td className="px-3 py-2 font-bold">{hours}</td>
                    <td className="px-3 py-2">
                      {r.check_out_time ? (
                        <span className="inline-flex rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-bold">Hoàn thành</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-bold">Đang làm</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
