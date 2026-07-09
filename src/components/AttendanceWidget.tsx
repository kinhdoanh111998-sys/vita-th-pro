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

// CẬP NHẬT TYPE THEO ĐÚNG DATABASE THỰC TẾ
type Shift = { id: string; name: string; start_time: string; end_time: string; is_active: boolean };
type StaffShift = { id: string; shift_type: string; date: string; status: string };
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

  const [chosenShiftType, setChosenShiftType] = useState<string>("");
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

  // Lấy danh mục Ca làm việc (để lấy giờ start/end)
  const shiftsQ = useQuery({
    queryKey: ["portal-shifts-list"],
    queryFn: async (): Promise<Shift[]> => {
      const { data } = await supabase.from("shifts").select("*").eq("is_active", true);
      return (data ?? []) as Shift[];
    },
    refetchOnWindowFocus: true,
  });

  // VÁ LỖI 1: TRỎ ĐÚNG VÀO BẢNG staff_shifts ĐỂ LẤY CA HÔM NAY ĐÃ DUYỆT
  const myShiftsTodayQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-staff-shifts-today", uid, day],
    queryFn: async (): Promise<StaffShift[]> => {
      const { data, error } = await supabase.from("staff_shifts")
        .select("id, shift_type, date, status")
        .eq("staff_id", uid!)
        .eq("date", day)
        .eq("status", "approved");
      if (error) throw error;
      return (data ?? []) as StaffShift[];
    },
    refetchOnWindowFocus: true,
  });

  // Lấy dữ liệu Chấm công thực tế
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
  
  // LOGIC MAP CA: Tìm xem shift_id lưu trong attendances ứng với ca nào để đếm ngược
  // Tạm thời nếu DB chưa lưu chuẩn, ta chỉ hiển thị trạng thái
  const currentShift = useMemo(() => {
     if(!att?.shift_id || !shiftsQ.data) return null;
     // Giả định bảng attendances đang lưu trực tiếp ID của bảng shifts vào shift_id
     return shiftsQ.data.find(s => s.id === att.shift_id) || null;
  }, [att?.shift_id, shiftsQ.data]);

  const endMs = useMemo(() => {
    if (!currentShift) return null;
    const [hh, mm] = currentShift.end_time.split(":").map(Number);
    const end = new Date(); end.setHours(hh, mm, 0, 0);
    return end.getTime();
  }, [currentShift]);

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
    if (!chosenShiftType) { toast.error("Chọn ca làm việc"); return; }
    setBusy(true);

    // Tìm ID của ca tương ứng trong bảng shifts để nạp vào tham số
    let actualShiftId = "";
    if(shiftsQ.data) {
       // Cố gắng map shift_type (ví dụ 'sang') sang bảng shifts
       let found = shiftsQ.data.find(s => s.name.toLowerCase().includes(chosenShiftType.replace('_', ' ')));
       // Fallback nếu ca_ngay
       if(!found && chosenShiftType === 'ca_ngay') found = shiftsQ.data[0]; 
       if(found) actualShiftId = found.id;
    }

    if(!actualShiftId) {
        toast.error("Không tìm thấy cấu hình giờ cho ca này.");
        setBusy(false);
        return;
    }

    const { error } = await supabase.rpc("fn_check_in", { p_shift_id: actualShiftId });
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

  if (attQ.isLoading || shiftsQ.isLoading || myShiftsTodayQ.isLoading) return <Card>Đang tải chấm công…</Card>;

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
            <div className="text-2xl font-black text-brand-dark mt-1">{currentShift?.name ?? "Đang làm việc"}</div>
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

  if (att && !att.check_in_approved) {
    return (
      <Card tone="warn">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-8 text-amber-600" />
          <div>
            <div className="text-lg font-black text-amber-800">Đang trong ca – Chờ duyệt</div>
            <div className="text-xs text-amber-900/80 mt-0.5">
              Bạn đã Check-in lúc {new Date(att.check_in_time!).toLocaleTimeString("vi-VN")}.
            </div>
          </div>
        </div>
        <Button disabled className="mt-4 w-full h-12 opacity-60"><LogOut className="size-4 mr-2 inline" />Chờ duyệt để Check-out</Button>
      </Card>
    );
  }

  // TÌNH HUỐNG CHƯA CHECK-IN
  const approvedShifts = myShiftsTodayQ.data ?? [];

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
            <Label className="text-xs">Chọn ca làm hôm nay (Đã được duyệt)</Label>
            <Select value={chosenShiftType} onValueChange={setChosenShiftType}>
              <SelectTrigger><SelectValue placeholder="Chọn ca..." /></SelectTrigger>
              <SelectContent>
                {approvedShifts.map((s) => (
                  <SelectItem key={s.id} value={s.shift_type}>
                    Ca: {s.shift_type === 'sang' ? 'Ca Sáng' : s.shift_type === 'chieu' ? 'Ca Chiều' : 'Cả ngày'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={doCheckIn} disabled={busy || !chosenShiftType} className="mt-4 w-full h-12">
            BẤM CHECK-IN VÀO CA
          </Button>
        </>
      )}
    </Card>
  );
}

/* =========== ĐĂNG KÝ CA TƯƠNG LAI (LỊCH TUẦN) =========== */
export function ShiftRegistrationPanel() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const uid = session?.user.id;

  const [date, setDate] = useState(todayISO());
  const [shiftType, setShiftType] = useState("");
  const [busy, setBusy] = useState(false);

  // VÁ LỖI 2: ĐỔI BẢNG LẤY LỊCH TUẦN THÀNH staff_shifts
  const weekStart = todayISO();
  const weekEnd = (() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  })();

  const weekRegsQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-staff-shifts-week", uid, weekStart, weekEnd],
    queryFn: async (): Promise<StaffShift[]> => {
      const { data, error } = await supabase.from("staff_shifts")
        .select("id, shift_type, date, status")
        .eq("staff_id", uid!)
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("date");
      if (error) throw error;
      return (data ?? []) as StaffShift[];
    },
    refetchOnWindowFocus: true,
  });

  const submit = async () => {
    // Tạm thời ẩn hàm này nếu bạn tạo Lịch từ trang Admin. 
    // Nếu muốn nhân viên tự đăng ký, ta sẽ viết lệnh Insert vào bảng duyệt sau.
    toast.error("Vui lòng liên hệ Quản lý để xếp ca làm việc.");
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <CalendarPlus className="size-5 text-brand" />
        <div className="font-black text-brand-dark">Lịch làm việc Tuần này</div>
      </div>

      <div className="mt-3 space-y-1.5">
        {(weekRegsQ.data ?? []).length === 0 ? (
          <div className="text-xs text-ink-muted">Chưa có ca nào trong 7 ngày tới.</div>
        ) : (weekRegsQ.data ?? []).map((r) => {
          const tone = r.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : r.status === "rejected" ? "bg-red-100 text-red-800 border-red-200"
            : "bg-amber-100 text-amber-800 border-amber-200";
          return (
            <div key={r.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${tone}`}>
              <div>
                <b>{new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</b>
                <span className="ml-2 font-semibold">
                  Ca: {r.shift_type === 'sang' ? 'Ca Sáng' : r.shift_type === 'chieu' ? 'Ca Chiều' : 'Cả ngày'}
                </span>
              </div>
              <Badge className="bg-white/70 text-inherit border">{r.status}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Card({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brand" | "warn" | "success" }) {
  const tones: any = { plain: "border-hairline bg-white", brand: "border-brand/40 bg-white", warn: "border-amber-200 bg-amber-50", success: "border-emerald-200 bg-emerald-50" };
  return <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>{children}</div>;
}
