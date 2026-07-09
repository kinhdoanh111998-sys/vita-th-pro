import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, ShieldCheck, CheckCircle2, CalendarPlus, AlarmClockOff, PlusCircle } from "lucide-react";
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

// TYPE CẬP NHẬT CHUẨN DATABASE
type Shift = { id: string; name: string; start_time: string; end_time: string; is_active: boolean };
type StaffShift = { id: string; shift_type: string; date: string; status: string };
type Attendance = {
  id: string; shift_id: string | null;
  check_in_time: string | null; check_out_time: string | null;
  check_in_approved: boolean; ot_hours: number; ot_approved: boolean; notes: string | null;
  early_checkout_requested?: boolean; 
  early_checkout_reason?: string | null;
  early_checkout_approved?: boolean; // Cờ duyệt về sớm
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

  const [chosenShiftId, setChosenShiftId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [earlyOpen, setEarlyOpen] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");
  const [earlySaving, setEarlySaving] = useState(false);
  const [autoCheckoutIds, setAutoCheckoutIds] = useState<Set<string>>(new Set());

  // Nhịp đập thời gian thực (1 giây/lần)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 1. Danh sách cấu hình Giờ (Admin)
  const shiftsQ = useQuery({
    queryKey: ["portal-shifts-list"],
    queryFn: async (): Promise<Shift[]> => {
      const { data } = await supabase.from("shifts").select("*").eq("is_active", true);
      return (data ?? []) as Shift[];
    },
    refetchOnWindowFocus: true,
  });

  // 2. Lịch được duyệt của ngày hôm nay (Từ bảng staff_shifts)
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

  // 3. Toàn bộ lịch sử Check-in của ngày hôm nay
  const attsQ = useQuery({
    enabled: !!uid,
    queryKey: ["portal-my-atts-today", uid, day],
    queryFn: async (): Promise<Attendance[]> => {
      const { data, error } = await supabase.from("attendances")
        .select("id,shift_id,check_in_time,check_out_time,check_in_approved,ot_hours,ot_approved,notes,early_checkout_requested,early_checkout_reason,early_checkout_approved")
        .eq("employee_id", uid!)
        .eq("date", day) // <--- ĐÃ SỬA THÀNH .eq ĐỂ LẤY CHUẨN NGÀY HÔM NAY
        .order("check_in_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
    refetchOnWindowFocus: true,
  });

  const shifts = shiftsQ.data ?? [];
  const shiftSang = shifts.find(s => s.name.toLowerCase().includes("sáng"));
  const shiftChieu = shifts.find(s => s.name.toLowerCase().includes("chiều"));

  const atts = attsQ.data ?? [];
  const activeAtt = atts.find(a => !a.check_out_time);
  const completedAtts = atts.filter(a => a.check_out_time);
  const activeShiftConf = activeAtt?.shift_id ? shifts.find(s => s.id === activeAtt.shift_id) : null;

  /* ================== AUTO CHECKOUT THỤ ĐỘNG ================== */
  useEffect(() => {
    if (!activeAtt || !activeShiftConf) return;
    const [h, m] = activeShiftConf.end_time.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(h, m, 0, 0);

    if (new Date() > endDate && !autoCheckoutIds.has(activeAtt.id)) {
      setAutoCheckoutIds(prev => new Set(prev).add(activeAtt.id));
      supabase.from("attendances").update({
        check_out_time: endDate.toISOString(),
        notes: (activeAtt.notes ? activeAtt.notes + " " : "") + "[Hệ thống tự động Check-out khi hết giờ]"
      }).eq("id", activeAtt.id).then(({error}) => {
        if (!error) {
          toast.info(`Hết giờ! Hệ thống đã tự động Check-out ca ${activeShiftConf.name}.`);
          qc.invalidateQueries({ queryKey: ["portal-my-atts-today"] });
        }
      });
    }
  }, [activeAtt, activeShiftConf, now, autoCheckoutIds, qc]);

  /* ================== THUẬT TOÁN DROPDOWN & TĂNG CA ================== */
  const availableOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    let allRegularDoneOrPassed = true;
    const allowedIds = new Set<string>();

    (myShiftsTodayQ.data ?? []).forEach(ss => {
      if (ss.shift_type === 'sang' && shiftSang) allowedIds.add(shiftSang.id);
      if (ss.shift_type === 'chieu' && shiftChieu) allowedIds.add(shiftChieu.id);
      if (ss.shift_type === 'ca_ngay') {
        if (shiftSang) allowedIds.add(shiftSang.id);
        if (shiftChieu) allowedIds.add(shiftChieu.id);
      }
    });

    allowedIds.forEach(id => {
      const conf = shifts.find(s => s.id === id);
      if (!conf) return;
      const isCompleted = completedAtts.some(a => a.shift_id === id);
      const [h, m] = conf.end_time.split(':').map(Number);
      const endDate = new Date(); endDate.setHours(h, m, 0, 0);
      const isPassed = new Date() > endDate;

      if (!isCompleted && !isPassed) {
        allRegularDoneOrPassed = false;
        opts.push({ id: conf.id, label: `${conf.name} (${conf.start_time.slice(0,5)} - ${conf.end_time.slice(0,5)})` });
      }
    });

    if (allRegularDoneOrPassed && !activeAtt) {
      opts.push({ id: "OT", label: "🔥 Đăng ký Tăng ca (OT)" });
    }

    return opts;
  }, [myShiftsTodayQ.data, completedAtts, shifts, shiftSang, shiftChieu, activeAtt]);

  /* ================== HÀNH ĐỘNG ================== */
  const doCheckIn = async () => {
    if (!chosenShiftId) { toast.error("Chọn ca làm việc"); return; }
    setBusy(true);
    try {
      if (chosenShiftId === "OT") {
        const { error } = await supabase.from("attendances").upsert({
          employee_id: uid, date: day, shift_id: null, notes: "Tăng ca (Chờ duyệt)", check_in_time: new Date().toISOString()
        }, { onConflict: 'employee_id,date' }); // <-- Đã sửa thành upsert và thêm onConflict
        
        if (error) throw error;
        toast.success("Check-in Tăng ca thành công. Hãy báo Quản lý duyệt!");
      } else {
        const { error } = await supabase.from("attendances").upsert({
          employee_id: uid, date: day, shift_id: chosenShiftId, check_in_time: new Date().toISOString()
        }, { onConflict: 'employee_id,date' }); // <-- Đã sửa thành upsert và thêm onConflict
        
        if (error) throw error;
        toast.success("Check-in thành công. Chờ duyệt diện mạo!");
      }
      setChosenShiftId("");
      qc.invalidateQueries({ queryKey: ["portal-my-atts-today"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const doCheckOut = async () => {
    if (!activeAtt) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("attendances").update({
        check_out_time: new Date().toISOString(), notes: notes || activeAtt.notes
      }).eq("id", activeAtt.id);
      if (error) throw error;
      toast.success("Đã Check-out thành công!");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["portal-my-atts-today"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const requestEarlyCheckout = async () => {
    if (!activeAtt) return;
    if (!earlyReason.trim()) { toast.error("Vui lòng nhập lý do"); return; }
    setEarlySaving(true);
    try {
      const { error } = await supabase.from("attendances").update({
        early_checkout_requested: true,
        early_checkout_reason: earlyReason.trim()
      }).eq("id", activeAtt.id);
      if (error) throw error;
      toast.success("Đã gửi yêu cầu tan ca sớm.");
      setEarlyOpen(false);
      qc.invalidateQueries({ queryKey: ["portal-my-atts-today"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Không gửi được yêu cầu");
    } finally {
      setEarlySaving(false);
    }
  };

  if (attsQ.isLoading || shiftsQ.isLoading || myShiftsTodayQ.isLoading) {
    return <Card>Đang tải dữ liệu chấm công…</Card>;
  }

  const earlyRequested = !!activeAtt?.early_checkout_requested;
  const earlyApproved = !!activeAtt?.early_checkout_approved;
  const isOT = !activeAtt?.shift_id;

  return (
    <Card tone={activeAtt ? (activeAtt.check_in_approved ? "brand" : "warn") : "plain"}>
      <div className="flex items-center gap-3 mb-4">
        <Clock className={`size-6 ${activeAtt ? 'text-brand-dark' : 'text-brand'}`} />
        <div className="text-lg font-black text-brand-dark">Bảng Chấm Công Hôm Nay</div>
      </div>

      {/* KHỐI 1: TRẠNG THÁI ĐANG TRONG CA */}
      {activeAtt && (
        <div className="mb-6">
          {!activeAtt.check_in_approved ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <ShieldCheck className="size-5" /> Đang chờ quản lý duyệt Check-in...
              </div>
              <div className="text-sm mt-1 text-amber-900/80">
                Bạn đã check-in lúc {new Date(activeAtt.check_in_time!).toLocaleTimeString('vi-VN')}. Nút Check-out sẽ mở khóa sau khi được duyệt.
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-xs uppercase font-bold text-brand mb-1">Trạng thái: Đang làm việc</div>
                  <div className="text-2xl font-black">
                    {activeAtt.shift_id ? activeShiftConf?.name : "Tăng ca (OT)"}
                  </div>
                </div>
                {activeShiftConf && (
                  <div className="text-right">
                    <div className="text-xs font-bold text-ink-muted">Tự động Check-out lúc</div>
                    <div className="text-xl font-mono text-brand-dark font-black">
                      {activeShiftConf.end_time.slice(0, 5)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* THÔNG BÁO XIN VỀ SỚM */}
              {earlyRequested && !earlyApproved && (
                 <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm mb-4 border border-amber-200 shadow-sm">
                   ⏳ Bạn đã gửi yêu cầu tan ca sớm. <b>Đang chờ Quản lý duyệt...</b>
                 </div>
              )}
              {earlyRequested && earlyApproved && (
                 <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm mb-4 border border-emerald-200 shadow-sm">
                   ✅ <b>Quản lý đã duyệt cho phép về sớm.</b> Hãy bấm Check-out ngay để ra về.
                 </div>
              )}
              
              {/* KHU VỰC GHI CHÚ VÀ NÚT HÀNH ĐỘNG ĐỘNG */}
              <div className="flex flex-col gap-3 mt-4">
                <Input 
                   value={notes} 
                   onChange={(e) => setNotes(e.target.value)} 
                   placeholder="Ghi chú xuất ca (nếu có)..." 
                   className="h-12 bg-white" 
                />
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {isOT ? (
                    // Trạng thái 1: Ca OT -> Luôn được tự Check-out
                    <Button onClick={doCheckOut} disabled={busy} className="flex-1 h-14 bg-brand hover:bg-brand-dark">
                      <LogOut className="size-4 mr-2 inline" /> Check-out xuất ca
                    </Button>
                  ) : earlyRequested && !earlyApproved ? (
                    // Trạng thái 2: Đã xin về -> Khóa nút chờ duyệt
                    <Button disabled className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 text-white opacity-80 cursor-not-allowed">
                      <Clock className="size-4 mr-2 inline" /> Đang chờ duyệt về sớm...
                    </Button>
                  ) : earlyRequested && earlyApproved ? (
                    // Trạng thái 3: Quản lý đã duyệt -> Mở khóa nút
                    <Button onClick={doCheckOut} disabled={busy} className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <LogOut className="size-4 mr-2 inline" /> Check-out ngay
                    </Button>
                  ) : (
                    // Trạng thái 4: Bình thường (Chưa hết giờ) -> Mở form xin về sớm
                    <Button onClick={() => setEarlyOpen(true)} disabled={busy} className="flex-1 h-14 bg-brand hover:bg-brand-dark">
                      <AlarmClockOff className="size-4 mr-2 inline" /> Xin check-out sớm
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KHỐI 2: CHỌN CA ĐỂ CHECK-IN */}
      {!activeAtt && availableOptions.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-hairline bg-slate-50">
          <Label className="text-xs font-bold text-ink mb-2 block">Ca làm việc khả dụng lúc này:</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={chosenShiftId} onValueChange={setChosenShiftId}>
              <SelectTrigger className="flex-1 bg-white h-12"><SelectValue placeholder="Bấm chọn ca..." /></SelectTrigger>
              <SelectContent>
                {availableOptions.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className={opt.id === "OT" ? "text-brand font-bold" : ""}>
                    {opt.id === "OT" && <PlusCircle className="size-4 mr-2 inline" />}
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={doCheckIn} disabled={busy || !chosenShiftId} className="h-12 whitespace-nowrap">
               <LogIn className="size-4 mr-2 inline" /> BẤM CHECK-IN
            </Button>
          </div>
        </div>
      )}

      {!activeAtt && availableOptions.length === 0 && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold">
          <CheckCircle2 className="size-8 mx-auto mb-2 opacity-80" />
          Tuyệt vời! Bạn đã hoàn thành toàn bộ ca làm việc ngày hôm nay.
        </div>
      )}

      {/* KHỐI 3: LỊCH SỬ CHẤM CÔNG HÔM NAY */}
      {completedAtts.length > 0 && (
        <div className="pt-4 border-t border-hairline">
          <div className="text-xs font-black uppercase text-ink-muted mb-3">Lịch sử hôm nay</div>
          <div className="space-y-2">
            {completedAtts.map(a => {
              const sConf = a.shift_id ? shifts.find(s => s.id === a.shift_id) : null;
              return (
                <div key={a.id} className="flex justify-between items-center p-3 rounded-lg border border-hairline bg-[#fafcf7]">
                  <div>
                    <div className="font-bold text-sm text-ink">{sConf?.name ?? "Tăng ca (OT)"}</div>
                    <div className="text-xs text-ink-muted font-mono mt-0.5">
                      Vào: {new Date(a.check_in_time!).toLocaleTimeString('vi-VN')} · Ra: {new Date(a.check_out_time!).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Hoàn thành</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIALOG XIN VỀ SỚM */}
      <Dialog open={earlyOpen} onOpenChange={setEarlyOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlarmClockOff className="size-5 text-amber-600" /> Yêu cầu tan ca sớm
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Label className="text-xs">Lý do xin về sớm <span className="text-red-500">*</span></Label>
            <Textarea value={earlyReason} onChange={(e) => setEarlyReason(e.target.value)}
              placeholder="Ví dụ: Có việc đột xuất gia đình, đi khám bệnh..." rows={4} />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEarlyOpen(false)}>Huỷ</Button>
            <Button onClick={requestEarlyCheckout} disabled={earlySaving}>Gửi yêu cầu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Bảng lịch tuần (Không đổi)
export function ShiftRegistrationPanel() {
  const { session } = useAuth();
  const uid = session?.user.id;
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
          const tone = r.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
          return (
            <div key={r.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${tone}`}>
              <div>
                <b>{new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</b>
                <span className="ml-2 font-semibold">
                  Ca: {r.shift_type === 'sang' ? 'Ca Sáng' : r.shift_type === 'chieu' ? 'Ca Chiều' : 'Cả ngày'}
                </span>
              </div>
              <Badge className="bg-white/70 text-inherit">{r.status}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Card({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brand" | "warn" | "success" }) {
  const tones: any = { plain: "border-hairline bg-white", brand: "border-brand/40 bg-white shadow-brand/10", warn: "border-amber-200 bg-amber-50", success: "border-emerald-200 bg-emerald-50" };
  return <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>{children}</div>;
}
