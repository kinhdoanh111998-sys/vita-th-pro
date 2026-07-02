import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, ShieldCheck, CheckCircle2, CalendarPlus, AlarmClockOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Shift = { id: string; name: string; start_time: string; end_time: string; is_active: boolean };
type Registration = { id: string; shift_id: string; date: string; status: "pending" | "approved" | "rejected" };
type Attendance = {
  id: string; shift_id: string | null;
  check_in_time: string | null; check_out_time: string | null;
  check_in_approved: boolean; ot_hours: number; ot_approved: boolean; notes: string | null;
  early_checkout_requested?: boolean; early_checkout_reason?: string | null;
};


const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function AttendanceWidget() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const uid = session?.user.id;
  const day = todayISO();

  const [chosenShift, setChosenShift] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");
  const [earlySaving, setEarlySaving] = useState(false);

  // Live tick 1s để countdown & tự đổi nút khi hết ca
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);


  const shiftsQ = useQuery({
    queryKey: ["portal-shifts-map"],
    queryFn: async (): Promise<Record<string, Shift>> => {
      const { data } = await supabase.from("shifts").select("*");
      const m: Record<string, Shift> = {};
      (data ?? []).forEach((s) => { m[s.id] = s as Shift; });
      return m;
    },
  });

  // Đăng ký đã được duyệt hôm nay (để chọn khi check-in)
  const regsQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-my-regs-today", uid, day],
    queryFn: async (): Promise<Registration[]> => {
      const { data, error } = await supabase.from("shift_registrations")
        .select("id,shift_id,date,status")
        .eq("employee_id", uid!).eq("date", day).eq("status", "approved");
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const attQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-my-att-today", uid, day],
    queryFn: async (): Promise<Attendance | null> => {
      const { data, error } = await supabase.from("attendances")
        .select("id,shift_id,check_in_time,check_out_time,check_in_approved,ot_hours,ot_approved,notes")
        .eq("employee_id", uid!).eq("date", day).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Attendance | null;
    },
  });

  const att = attQ.data;
  const shift = att?.shift_id ? shiftsQ.data?.[att.shift_id] : null;

  // Countdown tới giờ kết thúc ca
  const endMs = useMemo(() => {
    if (!shift) return null;
    const [hh, mm] = shift.end_time.split(":").map(Number);
    const end = new Date(); end.setHours(hh, mm, 0, 0);
    return end.getTime();
  }, [shift]);
  const remaining = endMs ? Math.max(0, endMs - now) : 0;
  const remH = Math.floor(remaining / 3_600_000);
  const remM = Math.floor((remaining % 3_600_000) / 60_000);
  const remS = Math.floor((remaining % 60_000) / 1000);
  const shiftEnded = endMs !== null && remaining <= 0;

  const requestEarlyCheckout = async () => {
    if (!att) return;
    if (!earlyReason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    setEarlySaving(true);
    try {
      const { error } = await supabase.from("attendances").update({
        early_checkout_requested: true,
        early_checkout_reason: earlyReason.trim(),
        early_checkout_requested_at: new Date().toISOString(),
      }).eq("id", att.id);
      if (error) throw error;

      // Thông báo khẩn cho quản lý
      try {
        const { data: ops } = await supabase.from("user_roles")
          .select("user_id").in("role", ["admin", "manager"] as any);
        const notifs = (ops ?? []).map((r: any) => ({
          recipient_id: r.user_id,
          actor_id: uid ?? null,
          type: "early_checkout_request",
          title: "⚠️ Yêu cầu tan ca sớm",
          body: `Nhân viên xin về sớm · Lý do: ${earlyReason.trim()}`,
          ref_type: "attendance",
          ref_id: att.id,
        }));
        if (notifs.length) await supabase.from("notifications").insert(notifs);
      } catch (nerr) { console.warn("[early notify]", nerr); }

      toast.success("Đã gửi yêu cầu tan ca sớm.");
      setEarlyOpen(false);
      setEarlyReason("");
      qc.invalidateQueries({ queryKey: ["portal-my-att-today"] });
    } catch (e: any) {
      console.error("[earlyCheckout]", e);
      toast.error(e?.message ?? "Không gửi được yêu cầu");
    } finally {
      setEarlySaving(false);
    }
  };


  const doCheckIn = async () => {
    if (!chosenShift) { toast.error("Chọn ca làm việc"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("fn_check_in", { p_shift_id: chosenShift });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã Check-in. Chờ quản lý duyệt diện mạo.");
    qc.invalidateQueries({ queryKey: ["portal-my-att-today"] });
  };

  const doCheckOut = async () => {
    if (!att) return;
    setBusy(true);
    const { error } = await supabase.rpc("fn_check_out", {
      p_attendance_id: att.id, p_notes: notes || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã Check-out. Hệ thống đã tính OT (nếu có).");
    qc.invalidateQueries({ queryKey: ["portal-my-att-today"] });
  };

  /* ---------- Renders theo trạng thái ---------- */
  if (attQ.isLoading || shiftsQ.isLoading) {
    return <Card>Đang tải chấm công…</Card>;
  }

  // Đã check-out
  if (att?.check_out_time) {
    return (
      <Card tone="success">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-8 text-emerald-600" />
          <div>
            <div className="text-lg font-black text-emerald-700">Đã hoàn thành ngày làm việc tuyệt vời!</div>
            <div className="text-xs text-emerald-800/80 mt-0.5">
              Check-in {new Date(att.check_in_time!).toLocaleTimeString("vi-VN")} · Check-out {new Date(att.check_out_time).toLocaleTimeString("vi-VN")}
              {Number(att.ot_hours) > 0 && <> · OT <b>{att.ot_hours}h</b> {att.ot_approved ? "(đã duyệt)" : "(chờ duyệt)"}</>}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Đã check-in, đã duyệt → cho phép check-out
  if (att && att.check_in_approved) {
    return (
      <Card tone="brand">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-brand">Đang trong ca</div>
            <div className="text-2xl font-black text-brand-dark mt-1">{shift?.name ?? "Ca làm"}</div>
            <div className="text-xs text-ink-muted font-mono mt-0.5">
              {shift?.start_time.slice(0, 5)} – {shift?.end_time.slice(0, 5)}
            </div>
          </div>
          {endMs && (
            <div className="text-right">
              <div className="text-xs text-ink-muted font-bold">Còn lại</div>
              <div className="text-3xl font-black text-brand-dark font-mono">{remH}h {remM.toString().padStart(2, "0")}m</div>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          <Label className="text-xs">Ghi chú cuối ca (tuỳ chọn)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Bàn giao, sự cố, khách VIP..." />
        </div>
        <Button onClick={doCheckOut} disabled={busy}
          className="mt-4 w-full h-14 text-base bg-red-600 hover:bg-red-700">
          <LogOut className="size-5 mr-2 inline" /> BẤM CHECK-OUT XUẤT CA
        </Button>
      </Card>
    );
  }

  // Đã check-in nhưng chưa duyệt
  if (att && !att.check_in_approved) {
    return (
      <Card tone="warn">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-8 text-amber-600" />
          <div>
            <div className="text-lg font-black text-amber-800">Đang trong ca – Chờ quản lý duyệt diện mạo</div>
            <div className="text-xs text-amber-900/80 mt-0.5">
              Bạn đã Check-in lúc {new Date(att.check_in_time!).toLocaleTimeString("vi-VN")}.
              Nút Check-out sẽ mở khi quản lý xác nhận.
            </div>
          </div>
        </div>
        <Button disabled className="mt-4 w-full h-12 opacity-60"><LogOut className="size-4 mr-2 inline" />Chờ duyệt để Check-out</Button>
      </Card>
    );
  }

  // Chưa check-in
  const approvedShifts = (regsQ.data ?? []).map((r) => shiftsQ.data?.[r.shift_id]).filter(Boolean) as Shift[];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="size-10 grid place-items-center rounded-xl bg-brand-soft text-brand-dark">
          <Clock className="size-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-ink-muted">Chấm công hôm nay</div>
          <div className="text-lg font-black text-brand-dark">Chưa Check-in</div>
        </div>
      </div>

      {approvedShifts.length === 0 ? (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          Hôm nay chưa có ca nào được duyệt cho bạn. Hãy đăng ký ca ở khối bên dưới và chờ quản lý duyệt.
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Chọn ca làm hôm nay</Label>
            <Select value={chosenShift} onValueChange={setChosenShift}>
              <SelectTrigger><SelectValue placeholder="Chọn ca đã được duyệt..." /></SelectTrigger>
              <SelectContent>
                {approvedShifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={doCheckIn} disabled={busy || !chosenShift}
            className="mt-4 w-full h-14 text-base">
            <LogIn className="size-5 mr-2 inline" /> BẤM CHECK-IN VÀO CA
          </Button>
        </>
      )}
    </Card>
  );
}

/* =========== ĐĂNG KÝ CA TƯƠNG LAI =========== */
export function ShiftRegistrationPanel() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const uid = session?.user.id;

  const [date, setDate] = useState(todayISO());
  const [shiftId, setShiftId] = useState("");
  const [busy, setBusy] = useState(false);

  const shiftsQ = useQuery({
    queryKey: ["portal-shifts-active"],
    queryFn: async (): Promise<Shift[]> => {
      const { data } = await supabase.from("shifts").select("*").eq("is_active", true).order("start_time");
      return (data ?? []) as Shift[];
    },
  });

  // Lịch trong 7 ngày
  const weekStart = todayISO();
  const weekEnd = (() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  })();

  const weekRegsQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-my-regs-week", uid, weekStart, weekEnd],
    queryFn: async (): Promise<Registration[]> => {
      const { data, error } = await supabase.from("shift_registrations")
        .select("id,shift_id,date,status")
        .eq("employee_id", uid!).gte("date", weekStart).lte("date", weekEnd)
        .order("date");
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const submit = async () => {
    if (!shiftId) { toast.error("Chọn ca cần đăng ký"); return; }
    if (!uid) return;
    setBusy(true);
    const { error } = await supabase.from("shift_registrations")
      .insert({ employee_id: uid, shift_id: shiftId, date, status: "pending" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã gửi đăng ký ca, chờ quản lý duyệt.");
    setShiftId("");
    qc.invalidateQueries({ queryKey: ["portal-my-regs-week"] });
    qc.invalidateQueries({ queryKey: ["portal-my-regs-today"] });
  };

  const shiftMap = useMemo(() => {
    const m: Record<string, Shift> = {};
    (shiftsQ.data ?? []).forEach((s) => { m[s.id] = s; });
    return m;
  }, [shiftsQ.data]);

  return (
    <Card>
      <div className="flex items-center gap-2">
        <CalendarPlus className="size-5 text-brand" />
        <div className="font-black text-brand-dark">Lịch làm việc & Đăng ký ca</div>
      </div>

      {/* Lịch tuần */}
      <div className="mt-3 space-y-1.5">
        {(weekRegsQ.data ?? []).length === 0 ? (
          <div className="text-xs text-ink-muted">Chưa có ca nào trong 7 ngày tới.</div>
        ) : (weekRegsQ.data ?? []).map((r) => {
          const s = shiftMap[r.shift_id];
          const tone = r.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : r.status === "rejected" ? "bg-red-100 text-red-800 border-red-200"
            : "bg-amber-100 text-amber-800 border-amber-200";
          return (
            <div key={r.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${tone}`}>
              <div>
                <b>{new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</b>
                <span className="ml-2">{s?.name} · <span className="font-mono">{s?.start_time.slice(0, 5)}–{s?.end_time.slice(0, 5)}</span></span>
              </div>
              <Badge className="bg-white/70 text-inherit border">{r.status}</Badge>
            </div>
          );
        })}
      </div>

      {/* Form đăng ký */}
      <div className="mt-4 pt-4 border-t border-hairline space-y-2">
        <div className="text-sm font-bold">Đăng ký ca tương lai</div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
          <div>
            <Label className="text-xs">Ngày</Label>
            <Input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Ca</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger><SelectValue placeholder="Chọn ca..." /></SelectTrigger>
              <SelectContent>
                {(shiftsQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={submit} disabled={busy || !shiftId} className="w-full sm:w-auto">
              Gửi đăng ký
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ========== small shared card ========== */
function Card({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brand" | "warn" | "success" }) {
  const toneCls = tone === "brand" ? "border-brand/40 bg-white"
    : tone === "warn" ? "border-amber-200 bg-amber-50"
    : tone === "success" ? "border-emerald-200 bg-emerald-50"
    : "border-hairline bg-white";
  return <div className={`rounded-2xl border p-5 shadow-sm ${toneCls}`}>{children}</div>;
}
