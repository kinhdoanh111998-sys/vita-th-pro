import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  addMonths, endOfMonth, format, getDay, startOfMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/Button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type ShiftKey = "sang" | "chieu";
type DaySlots = { sang: boolean; chieu: boolean };
type MonthEntry = { date: string; sang: boolean; chieu: boolean };
type DBShift = "sang" | "chieu" | "ca_ngay";

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

// JS getDay: 0=CN..6=T7 → map to our ids
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
    out.push({
      date: format(d, "yyyy-MM-dd"),
      sang: w.sang,
      chieu: w.chieu,
    });
  }
  return out;
}

function toDBShift(sang: boolean, chieu: boolean): DBShift | null {
  if (sang && chieu) return "ca_ngay";
  if (sang) return "sang";
  if (chieu) return "chieu";
  return null;
}

const emptyWeek = (): Record<DayId, DaySlots> => ({
  T2: { sang: false, chieu: false },
  T3: { sang: false, chieu: false },
  T4: { sang: false, chieu: false },
  T5: { sang: false, chieu: false },
  T6: { sang: false, chieu: false },
  T7: { sang: false, chieu: false },
  CN: { sang: false, chieu: false },
});

export function StaffScheduleRegistration() {
  const { session } = useAuth();
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [weekly, setWeekly] = useState<Record<DayId, DaySlots>>(emptyWeek());
  const [month, setMonth] = useState<MonthEntry[] | null>(null);
  const [editing, setEditing] = useState<MonthEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleWeek = (id: DayId, k: ShiftKey) => {
    setWeekly((p) => ({ ...p, [id]: { ...p[id], [k]: !p[id][k] } }));
  };

  const generate = () => {
    setMonth(buildMonth(anchor, weekly));
    toast.success("Đã tạo lịch tháng. Bạn có thể click vào ngày để tinh chỉnh.");
  };

  const updateDay = (date: string, next: DaySlots) => {
    setMonth((cur) => (cur ?? []).map((e) => (e.date === date ? { ...e, ...next } : e)));
  };

  const submit = async () => {
    if (!session?.user.id) { toast.error("Chưa đăng nhập"); return; }
    if (!month?.length) { toast.error("Chưa có lịch để gửi"); return; }
    setSaving(true);
    try {
      const rows = month
        .map((e) => {
          const t = toDBShift(e.sang, e.chieu);
          return t ? { staff_id: session.user.id, date: e.date, shift_type: t, status: "pending" } : null;
        })
        .filter(Boolean) as Array<{ staff_id: string; date: string; shift_type: DBShift; status: string }>;

      // Xoá lịch cũ trong tháng để tránh trùng ngày (unique không có sẵn ở DB)
      const from = month[0].date;
      const to = month[month.length - 1].date;
      const { error: delErr } = await supabase
        .from("staff_shifts")
        .delete()
        .eq("staff_id", session.user.id)
        .gte("date", from)
        .lte("date", to);
      if (delErr) throw delErr;

      if (rows.length) {
        const { error: insErr } = await supabase.from("staff_shifts").insert(rows);
        if (insErr) throw insErr;
      }
      toast.success(`Đã gửi đăng ký ${rows.length} ca cho tháng ${format(anchor, "M/yyyy")}`);
    } catch (e: any) {
      console.error("[submit staff_shifts]", e);
      toast.error(e?.message ?? "Không lưu được lịch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="p-5 border-b border-hairline">
        <h3 className="font-black text-lg">Đăng ký lịch tháng</h3>
        <p className="text-xs text-ink-muted">
          Chọn ca cố định trong tuần rồi áp dụng cho tháng. Có thể click vào từng ngày để tinh chỉnh.
        </p>
      </div>

      {/* Bước 1: Tuần mẫu */}
      <div className="p-5 border-b border-hairline">
        <div className="text-sm font-black mb-3">1 · Tuần mẫu</div>
        <div className="divide-y divide-hairline">
          {DAYS.map((d) => {
            const w = weekly[d.id];
            return (
              <div key={d.id} className="flex items-center gap-3 py-2">
                <div className="w-24 font-bold text-sm">{d.label}</div>
                <ToggleChip active={w.sang} label="Ca Sáng" onClick={() => toggleWeek(d.id, "sang")} tone="amber" />
                <ToggleChip active={w.chieu} label="Ca Chiều" onClick={() => toggleWeek(d.id, "chieu")} tone="sky" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bước 2: Điều hướng tháng + tạo lịch */}
      <div className="p-5 border-b border-hairline flex flex-wrap items-center gap-3">
        <div className="text-sm font-black">2 · Chọn tháng</div>
        <div className="flex items-center gap-2">
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
        <div className="ml-auto flex gap-2">
          <Button onClick={generate}>Áp dụng cho tháng này</Button>
          <Button variant="ghost" onClick={() => { setMonth(null); setWeekly(emptyWeek()); }}>
            <X className="size-4 mr-1 inline" /> Xoá
          </Button>
        </div>
      </div>

      {/* Bước 3: Lịch tháng */}
      {month && (
        <div className="p-5">
          <div className="text-sm font-black mb-3">3 · Lịch tháng · click ô ngày để tinh chỉnh</div>
          <MonthGrid entries={month} anchor={anchor} onPick={(e) => setEditing(e)} />
          <div className="mt-4 flex justify-end">
            <Button onClick={submit} disabled={saving}>
              <Save className="size-4 mr-1.5 inline" />
              {saving ? "Đang lưu..." : "Lưu & Gửi Đăng Ký"}
            </Button>
          </div>
        </div>
      )}

      {/* Modal edit day */}
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
              <ToggleRow
                label="Ca Sáng (8h – 12h)"
                active={editing.sang}
                onClick={() => setEditing({ ...editing, sang: !editing.sang })}
              />
              <ToggleRow
                label="Ca Chiều (13h30 – 18h)"
                active={editing.chieu}
                onClick={() => setEditing({ ...editing, chieu: !editing.chieu })}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button
              onClick={() => {
                if (editing) {
                  updateDay(editing.date, { sang: editing.sang, chieu: editing.chieu });
                  setEditing(null);
                }
              }}
            >
              Xong
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
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold rounded-md border transition ${active ? toneOn : "bg-white border-hairline text-ink-muted hover:bg-brand-soft"}`}
    >
      {active ? "✓ " : ""}{label}
    </button>
  );
}

function ToggleRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-md border text-sm font-bold transition ${active ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-hairline text-ink hover:bg-brand-soft"}`}
    >
      {active ? "✓ " : ""}{label}
    </button>
  );
}

function MonthGrid({
  entries, anchor, onPick,
}: { entries: MonthEntry[]; anchor: Date; onPick: (e: MonthEntry) => void }) {
  const cells = useMemo(() => {
    const first = startOfMonth(anchor);
    const leading = (getDay(first) + 6) % 7;
    const out: (MonthEntry | null)[] = [];
    for (let i = 0; i < leading; i++) out.push(null);
    entries.forEach((e) => out.push(e));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [entries, anchor]);

  return (
    <div className="grid grid-cols-7 gap-px bg-hairline rounded-lg overflow-hidden">
      {WEEKDAYS.map((w, i) => (
        <div key={w} className={`bg-brand-dark text-white text-center text-xs font-black py-2 ${i === 6 ? "text-red-300" : ""}`}>
          {w}
        </div>
      ))}
      {cells.map((c, idx) => {
        if (!c) return <div key={idx} className="bg-gray-50 min-h-[80px]" />;
        const isWeekend = idx % 7 >= 5;
        const hasWork = c.sang || c.chieu;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onPick(c)}
            className={`text-left bg-white min-h-[80px] p-1.5 hover:bg-brand-soft/40 ${hasWork ? "bg-emerald-50/60" : ""}`}
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
