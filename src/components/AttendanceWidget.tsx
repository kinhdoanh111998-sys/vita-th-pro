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
    refetchOnWindowFocus: true,
  });

  const regsQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-my-regs-today", uid, day],
    queryFn: async (): Promise<Registration[]> => {
      const { data, error } = await supabase.from("shift_registrations")
        .select("id,shift_id,date,status")
        .eq("employee_id", uid!)
        .gte("date", day)
        .lte("date", day + " 23:59:59")
        .eq("status", "approved");
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
    refetchOnWindowFocus: true,
  });

  const attQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-my-att-today", uid, day],
    queryFn: async (): Promise<Attendance | null> => {
      const { data, error } = await supabase.from("attendances")
        .select("id,shift_id,check_in_time,check_out_time,check_in_approved,ot_hours,ot_approved,notes,early_checkout_requested,early_checkout_reason")
        .eq("employee_id", uid!)
        .gte("date", day)
        .lte("date", day + " 23:59:59")
        .limit(1)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (data ?? null) as Attendance | null;
    },
    refetchOnWindowFocus: true,
  });

  const att = attQ.data;
  const shift = att?.shift_id ? shiftsQ.data?.[att.shift_id] : null;

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
        early_checkout_reason: earlyReason.trim()
      }).eq("id", att.id);
      
      if (error) throw error;

      toast.success("Đã gửi yêu cầu tan ca sớm.");
      setEarlyOpen(false);
      qc.invalidateQueries({ queryKey: ["portal-my-att-today"] });
    } catch (e: any) {
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
    toast.success("Đã Check-in thành công!");
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
    toast.success("Đã Check-out.");
    qc.invalidateQueries({ queryKey: ["portal-my-att-today"] });
  };

  if (attQ.isLoading || shiftsQ.isLoading) return <Card>Đang tải chấm công…</Card>;

  if (att?.check_out_time) {
    return (
      <Card tone="success">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-8 text-emerald-600" />
          <div>
            <div className="text-lg font-black text-emerald-700">Đã hoàn thành ngày làm việc!</div>
            <div className="text-xs text-emerald-800/80 mt-0.5">
              Check-in {new Date(att.check_in_time!).toLocaleTimeString("vi-VN")} · Check-out {new Date(att.check_out_time).toLocaleTimeString("vi-VN")}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (att && att.check_in_approved) {
    const earlyRequested = !!att.early_checkout_requested;
    return (
      <Card tone={shiftEnded ? "warn" : "brand"}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className={`text-xs uppercase tracking-wider font-bold ${shiftEnded ? "text-red-600" : "text-brand"}`}>
              {shiftEnded ? "Đã hết giờ ca" : "Đang trong ca"}
            </div>
            <div className="text-2xl font-black text-brand-dark mt-1">{shift?.name ?? "Ca làm"}</div>
          </div>
          {endMs !== null && (
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-brand-dark">
                {shiftEnded ? "00:00:00" : `${remH.toString().padStart(2, "0")}:${remM.toString().padStart(2, "0")}:${remS.toString().padStart(2, "0")}`}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button onClick={doCheckOut} disabled={busy} className="flex-1 h-14">
             Check-out xuất ca
          </Button>
          {!shiftEnded && !earlyRequested && (
            <Button variant="ghost" onClick={() => setEarlyOpen(true)} className="h-14">
               Tan ca sớm
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const approvedShifts = (regsQ.data ?? []).map((r) => shiftsQ.data?.[r.shift_id]).filter(Boolean) as Shift[];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Clock className="size-6 text-brand" />
        <div className="text-lg font-black text-brand-dark">Chấm công hôm nay</div>
      </div>
      {approvedShifts.length === 0 ? (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          Hôm nay chưa có ca được duyệt. Vui lòng kiểm tra lịch đăng ký.
        </div>
      ) : (
        <>
          <div className="mt-4">
            <Label className="text-xs">Chọn ca làm</Label>
            <Select value={chosenShift} onValueChange={setChosenShift}>
              <SelectTrigger><SelectValue placeholder="Chọn ca..." /></SelectTrigger>
              <SelectContent>
                {approvedShifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={doCheckIn} disabled={busy || !chosenShift} className="mt-4 w-full h-12">
            BẤM CHECK-IN VÀO CA
          </Button>
        </>
      )}
    </Card>
  );
}

function Card({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brand" | "warn" | "success" }) {
  const tones: any = { plain: "border-hairline bg-white", brand: "border-brand/40 bg-white", warn: "border-amber-200 bg-amber-50", success: "border-emerald-200 bg-emerald-50" };
  return <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>{children}</div>;
}
