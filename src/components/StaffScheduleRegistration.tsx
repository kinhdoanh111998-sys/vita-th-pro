import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMonths, endOfMonth, format, getDay, startOfMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Lock, Save, X, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type ShiftKey = "sang" | "chieu";
type DaySlots = { sang: boolean; chieu: boolean };
type MonthEntry = { date: string; sang: boolean; chieu: boolean };
type DBShift = "sang" | "chieu" | "ca_ngay";
type BatchStatus = "pending" | "approved" | "rejected";

type ApprovalRequest = {
  id: string;
  staff_id: string;
  month: string;
  status: BatchStatus;
  review_note: string | null;
  reviewed_at: string | null;
};

type StaffShiftRow = {
  id: string;
  date: string;
  shift_type: DBShift;
  status: "pending" | "approved" | "rejected";
  request_batch_id: string | null;
};

const DAYS = [
  { id: "T2", label: "Thứ 2" },
  { id: "T3", label: "Thứ 3" },
  { id: "T4", label: "Thứ 4" },
  { id: "T5", label: "Thứ 5" },
  { id: "T6", label: "Thứ 6" },
  { id: "T7", label: "Thứ 7" },
  { id: "CN", label: "Chủ Nhật" },
] as const;
type DayId = typeof DAYS[number]["id"];
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dayIdFromDate(d: Date): DayId {
  const map: DayId[] = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return map[d.getDay()];
}

function buildMonth(anchor: Date, weekly: Record<DayId, DaySlots>): MonthEntry[] {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const out: MonthEntry[] = [];
  for (let day = 1; day <= last.getDate(); day++) {
    const d = new Date(first.getFullYear(), first.getMonth(), day);
    const id = dayIdFromDate(d);
    const w = weekly[id];
    out.push({ date: format(d, "yyyy-MM-dd"), sang: w.sang, chieu: w.chieu });
  }
  return out;
}

function toDBShift(sang: boolean, chieu: boolean): DBShift | null {
  if (sang && chieu) return "ca_ngay";
  if (sang) return "sang";
  if (chieu) return "chieu";
  return null;
}

function fromDBShift(t: DBShift): DaySlots {
  if (t === "ca_ngay") return { sang: true, chieu: true };
  if (t === "sang") return { sang: true, chieu: false };
  return { sang: false, chieu: true };
}

const emptyWeek = (): Record<DayId, DaySlots> => ({
  T2: { sang: false, chieu: false }, T3: { sang: false, chieu: false },
  T4: { sang: false, chieu: false }, T5: { sang: false, chieu: false },
  T6: { sang: false, chieu: false }, T7: { sang: false, chieu: false },
  CN: { sang: false, chieu: false },
});

// Hàm hỗ trợ lấy ngày hôm nay chuẩn định dạng
const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function StaffScheduleRegistration() {
  const { session, fullName } = useAuth();
  const qc = useQueryClient();
  const uid = session?.user.id ?? null;
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const monthKey = format(anchor, "yyyy-MM");

  const [weekly, setWeekly] = useState<Record<DayId, DaySlots>>(emptyWeek());
  const [draftMonth, setDraftMonth] = useState<MonthEntry[] | null>(null);
  const [editing, setEditing] = useState<{ date: string; sang: boolean; chieu: boolean; existingId?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Batch request cho tháng hiện tại
  const reqQ = useQuery({
    queryKey: ["shift-approval-request", uid, monthKey],
    enabled: !!uid,
    queryFn: async (): Promise<ApprovalRequest | null> => {
      try {
        const { data, error } = await supabase
          .from("shift_approval_requests")
          .select("id,staff_id,month,status,review_note,reviewed_at")
          .eq("staff_id", uid!)
          .eq("month", monthKey)
          .maybeSingle();
        if (error) throw error;
        return (data as ApprovalRequest | null) ?? null;
      } catch (e: any) {
        console.error("[reqQ]", e);
        return null;
      }
    },
  });

  // Lịch cá nhân trong tháng
  const shiftsQ = useQuery({
    queryKey: ["my-shifts-month", uid, monthKey],
    enabled: !!uid,
    queryFn: async (): Promise<StaffShiftRow[]> => {
      try {
        const from = format(startOfMonth(anchor), "yyyy-MM-dd");
        const to = format(endOfMonth(anchor), "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("staff_shifts")
          .select("id,date,shift_type,status,request_batch_id")
          .eq("staff_id", uid!)
          .gte("date", from)
          .lte("date", to)
          .order("date");
        if (error) throw error;
        return (data ?? []) as StaffShiftRow[];
      } catch (e: any) {
        console.error("[shiftsQ]", e);
        return [];
      }
    },
  });

  const request = reqQ.data ?? null;
  const locked = !!request && (request.status === "pending" || request.status === "approved");

  const toggleWeek = (id: DayId, k: ShiftKey) => {
    setWeekly((p) => ({ ...p, [id]: { ...p[id], [k]: !p[id][k] } }));
  };

  const generate = () => {
    setDraftMonth(buildMonth(anchor, weekly));
    toast.success("Đã tạo lịch tháng · click vào ngày để tinh chỉnh trước khi gửi.");
  };

  const updateDraftDay = (date: string, next: DaySlots) => {
    setDraftMonth((cur) => (cur ?? []).map((e) => (e.date === date ? { ...e, ...next } : e)));
  };

  const submitBatch = async () => {
    if (!uid) { toast.error("Chưa đăng nhập"); return; }
    if (!draftMonth?.length) { toast.error("Chưa có lịch để gửi"); return; }
    setSaving(true);
    try {
      const from = draftMonth[0].date;
      const to = draftMonth[draftMonth.length - 1].date;

      await supabase
        .from("staff_shifts")
        .delete()
        .eq("staff_id", uid)
        .gte("date", from).lte("date", to)
        .in("status", ["pending", "rejected"]);

      if (request?.status === "rejected") {
        await supabase.from("shift_approval_requests").delete().eq("id", request.id);
      }

      const { data: newReq, error: reqErr } = await supabase
        .from("shift_approval_requests")
        .insert({ staff_id: uid, month: monthKey, status: "pending" })
        .select("id")
        .single();
      if (reqErr) throw reqErr;
      const batchId = newReq.id as string;

      const rows = draftMonth
        .map((e) => {
          const t = toDBShift(e.sang, e.chieu);
          return t ? {
            staff_id: uid, date: e.date, shift_type: t,
            status: "pending", request_batch_id: batchId,
          } : null;
        })
        .filter(Boolean) as Array<{ staff_id: string; date: string; shift_type: DBShift; status: string; request_batch_id: string }>;

      if (rows.length) {
        const { error: insErr } = await supabase.from("staff_shifts").insert(rows);
        if (insErr) throw insErr;
      }

      try {
        const { data: ops } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "manager"] as any);
        const notifs = (ops ?? []).map((r: any) => ({
          recipient_id: r.user_id,
          actor_id: uid,
          type: "shift_request_pending",
          title: "Yêu cầu đăng ký lịch mới",
          body: `Nhân viên ${fullName ?? "—"} đã gửi yêu cầu đăng ký lịch tháng ${format(anchor, "M/yyyy")}.`,
          ref_type: "shift_approval_request",
          ref_id: batchId,
        }));
        if (notifs.length) await supabase.from("notifications").insert(notifs);
      } catch (nerr) {
        console.warn("[notify ops]", nerr);
      }

      toast.success(`Đã gửi ${rows.length} ca cho tháng ${format(anchor, "M/yyyy")} · chờ quản lý duyệt.`);
      setDraftMonth(null);
      setWeekly(emptyWeek());
      await qc.invalidateQueries({ queryKey: ["shift-approval-request", uid, monthKey] });
      await qc.invalidateQueries({ queryKey: ["my-shifts-month", uid, monthKey] });
    } catch (e: any) {
      console.error("[submitBatch]", e);
      toast.error(e?.message ?? "Không lưu được lịch");
    } finally {
      setSaving(false);
    }
  };

  const saveSingleDay = async () => {
    if (!editing || !uid) return;
    setSaving(true);
    try {
      if (editing.existingId) {
        await supabase.from("staff_shifts").delete()
          .eq("staff_id", uid).eq("date", editing.date);
      }
      const t = toDBShift(editing.sang, editing.chieu);
      if (t) {
        const { error } = await supabase.from("staff_shifts").insert({
          staff_id: uid, date: editing.date, shift_type: t, status: "pending",
        });
        if (error) throw error;
      }
      toast.success("Đã gửi thay đổi · chờ quản lý duyệt riêng.");
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["my-shifts-month", uid, monthKey] });
    } catch (e: any) {
      console.error("[saveSingleDay]", e);
      toast.error(e?.message ?? "Không lưu được");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { setDraftMonth(null); setWeekly(emptyWeek()); }, [monthKey]);

  const monthShiftsByDate = useMemo(() => {
    const m: Record<string, StaffShiftRow> = {};
    (shiftsQ.data ?? []).forEach((s) => { m[s.date] = s; });
    return m;
  }, [shiftsQ.data]);

  const monthEntries: MonthEntry[] = useMemo(() => {
    const first = startOfMonth(anchor);
    const last = endOfMonth(anchor);
    const out: MonthEntry[] = [];
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = format(d, "yyyy-MM-dd");
      const s = monthShiftsByDate[iso];
      out.push({
        date: iso,
        sang: s ? (s.shift_type === "sang" || s.shift_type === "ca_ngay") : false,
        chieu: s ? (s.shift_type === "chieu" || s.shift_type === "ca_ngay") : false,
      });
    }
    return out;
  }, [anchor, monthShiftsByDate]);

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="p-5 border-b border-hairline flex flex-wrap items-center gap-3">
        <div>
          <h3 className="font-black text-lg">Lịch làm việc & Đăng ký ca</h3>
          <p className="text-xs text-ink-muted">
            Đăng ký lịch theo tháng · Tuyệt đối không thể sửa lịch quá khứ.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setAnchor((d) => addMonths(d, -1))}
            className="p-1.5 rounded-md hover:bg-brand-soft border border-hairline">
            <ChevronLeft className="size-4" />
          </button>
          <div className="min-w-[140px] text-center font-black text-brand-dark">
            {format(anchor, "'Tháng' M, yyyy", { locale: vi })}
          </div>
          <button onClick={() => setAnchor((d) => addMonths(d, 1))}
            className="p-1.5 rounded-md hover:bg-brand-soft border border-hairline">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Trạng thái batch */}
      {request && (
        <div className={`px-5 py-3 border-b border-hairline flex flex-wrap items-center gap-3 ${
          request.status === "approved" ? "bg-emerald-50" :
          request.status === "rejected" ? "bg-red-50" : "bg-amber-50"
        }`}>
          {request.status === "pending" && <Badge className="bg-amber-500 text-white">Đang chờ duyệt</Badge>}
          {request.status === "approved" && <Badge className="bg-emerald-600 text-white"><ShieldCheck className="size-3 mr-1 inline" />Đã duyệt</Badge>}
          {request.status === "rejected" && <Badge className="bg-red-600 text-white">Bị từ chối</Badge>}
          <div className="text-xs text-ink-muted">
            {request.reviewed_at && `Cập nhật: ${new Date(request.reviewed_at).toLocaleString("vi-VN")}`}
            {request.review_note && ` · Ghi chú: ${request.review_note}`}
          </div>
          {request.status === "rejected" && (
            <span className="ml-auto text-xs font-bold text-red-700 flex items-center gap-1">
              <RefreshCw className="size-3" /> Bạn có thể chọn tuần mẫu và gửi lại.
            </span>
          )}
        </div>
      )}

      {/* Tuần mẫu — chỉ hiện khi chưa locked */}
      {!locked && (
        <>
          <div className="p-5 border-b border-hairline">
            <div className="text-sm font-black mb-3">1 · Tuần mẫu</div>
            <div className="divide-y divide-hairline">
              {DAYS.map((d) => {
                const w = weekly[d.id];
                return (
                  <div key={d.id} className="flex flex-wrap items-center gap-3 py-2">
                    <div className="w-24 font-bold text-sm">{d.label}</div>
                    <ToggleChip active={w.sang} label="Ca Sáng" onClick={() => toggleWeek(d.id, "sang")} tone="amber" />
                    <ToggleChip active={w.chieu} label="Ca Chiều" onClick={() => toggleWeek(d.id, "chieu")} tone="sky" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 border-b border-hairline flex flex-wrap items-center gap-3">
            <div className="text-sm font-black">2 · Áp dụng cho tháng</div>
            <div className="ml-auto flex gap-2">
              <Button onClick={generate}>Áp dụng cho tháng này</Button>
              <Button variant="ghost" onClick={() => { setDraftMonth(null); setWeekly(emptyWeek()); }}>
                <X className="size-4 mr-1 inline" /> Xoá
              </Button>
            </div>
          </div>

          {draftMonth && (
            <div className="p-5 border-b border-hairline">
              <div className="text-sm font-black mb-3">3 · Xem lại · click ô ngày tương lai để tinh chỉnh</div>
              <MonthGrid entries={draftMonth} anchor={anchor}
                onPick={(e) => setEditing({ date: e.date, sang: e.sang, chieu: e.chieu })} />
              <div className="mt-4 flex justify-end">
                <Button onClick={submitBatch} disabled={saving}>
                  <Save className="size-4 mr-1.5 inline" />
                  {saving ? "Đang gửi..." : "Gửi Đăng Ký"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Locked → chỉ hiện lịch cá nhân */}
      {locked && (
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
            <Lock className="size-4" />
            <span>Lịch đã duyệt/chờ duyệt · click vào một ngày tương lai để xin đổi ca.</span>
          </div>
          <MonthGrid
            entries={monthEntries} anchor={anchor} statusByDate={monthShiftsByDate}
            onPick={(e) => {
              const existing = monthShiftsByDate[e.date];
              setEditing({ date: e.date, sang: e.sang, chieu: e.chieu, existingId: existing?.id });
            }}
          />
        </div>
      )}

      {/* Modal edit 1 ngày */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              Chỉnh sửa ca ngày{" "}
              {editing ? format(new Date(editing.date), "EEEE, dd/MM/yyyy", { locale: vi }) : ""}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <ToggleRow label="Ca Sáng" active={editing.sang}
                onClick={() => setEditing({ ...editing, sang: !editing.sang })} />
              <ToggleRow label="Ca Chiều" active={editing.chieu}
                onClick={() => setEditing({ ...editing, chieu: !editing.chieu })} />
              {locked && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
                  Thay đổi này sẽ được gửi dưới dạng yêu cầu <b>chờ duyệt</b> riêng rẽ, không làm ảnh hưởng đến các ngày khác.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button
              onClick={() => {
                if (!editing) return;
                if (locked) {
                  saveSingleDay();
                } else {
                  updateDraftDay(editing.date, { sang: editing.sang, chieu: editing.chieu });
                  setEditing(null);
                }
              }}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Xong"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ToggleChip({
  active, label, onClick, tone,
}: { active: boolean; label: string; onClick: () => void; tone: "amber" | "sky" }) {
  const toneOn = tone === "amber" ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-sky-100 border-sky-400 text-sky-800";
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded-md border transition ${active ? toneOn : "bg-white border-hairline text-ink-muted hover:bg-brand-soft"}`}>
      {active ? "✓ " : ""}{label}
    </button>
  );
}

function ToggleRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full px-4 py-3 rounded-md border text-sm font-bold transition ${active ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-hairline text-ink hover:bg-brand-soft"}`}>
      {active ? "✓ " : ""}{label}
    </button>
  );
}

function MonthGrid({
  entries, anchor, onPick, statusByDate,
}: {
  entries: MonthEntry[]; anchor: Date;
  onPick: (e: MonthEntry) => void;
  statusByDate?: Record<string, StaffShiftRow>;
}) {
  const cells = useMemo(() => {
    const first = startOfMonth(anchor);
    const leading = (getDay(first) + 6) % 7;
    const out: (MonthEntry | null)[] = [];
    for (let i = 0; i < leading; i++) out.push(null);
    entries.forEach((e) => out.push(e));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [entries, anchor]);

  const tISO = todayISO(); // Lấy mốc chuẩn ngày hôm nay

  return (
    <div className="grid grid-cols-7 gap-px bg-hairline rounded-lg overflow-hidden">
      {WEEKDAYS.map((w, i) => (
        <div key={w} className={`bg-brand-dark text-white text-center text-xs font-black py-2 ${i === 6 ? "text-red-300" : ""}`}>{w}</div>
      ))}
      {cells.map((c, idx) => {
        if (!c) return <div key={idx} className="bg-gray-50 min-h-[80px]" />;
        
        const isWeekend = idx % 7 >= 5;
        const hasWork = c.sang || c.chieu;
        const st = statusByDate?.[c.date]?.status;
        const stTone =
          st === "approved" ? "border-l-4 border-l-emerald-500" :
          st === "rejected" ? "border-l-4 border-l-red-500" :
          st === "pending" ? "border-l-4 border-l-amber-500" : "";
        
        // VÁ LỖI 2 & 3: BẪY THỜI GIAN NGĂN CHẶN CLICK VÀO NGÀY QUÁ KHỨ
        const isPast = c.date < tISO;
        const pastClass = isPast ? "opacity-40 cursor-not-allowed bg-gray-100" : "hover:bg-brand-soft/40 bg-white";

        return (
          <button 
            key={idx} 
            type="button" 
            onClick={() => { if (!isPast) onPick(c); }} // Khóa click nếu là quá khứ
            className={`text-left min-h-[80px] p-1.5 transition ${pastClass} ${hasWork && !isPast ? "bg-emerald-50/60" : ""} ${stTone}`}
          >
            <div className={`text-xs font-bold ${isWeekend ? "text-red-600" : "text-ink"}`}>
              {new Date(c.date).getDate()}
            </div>
            <div className="mt-1 space-y-1">
              {c.sang && <div className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Sáng</div>}
              {c.chieu && <div className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">Chiều</div>}
              {!hasWork && <div className="text-[10px] text-ink-muted italic">nghỉ</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
