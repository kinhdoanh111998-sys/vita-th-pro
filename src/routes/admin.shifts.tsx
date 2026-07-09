import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Check, X, Clock, CalendarCheck2, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { StaffMonthCalendar } from "@/components/StaffMonthCalendar";
import { BatchApprovalTab } from "@/components/admin/BatchApprovalTab";

export const Route = createFileRoute("/admin/shifts")({
  component: ShiftsPage,
});

type Shift = {
  id: string; name: string; start_time: string; end_time: string;
  description: string | null; is_active: boolean;
};
type StaffUser = { id: string; full_name: string | null; email: string; role: string };
type Registration = {
  id: string; employee_id: string; shift_id: string; date: string;
  status: "pending" | "approved" | "rejected"; note: string | null;
  approved_by: string | null; approved_at: string | null;
};
// BỔ SUNG TYPE CHO VỀ SỚM
type Attendance = {
  id: string; employee_id: string; date: string; shift_id: string | null;
  check_in_time: string | null; check_out_time: string | null;
  check_in_approved: boolean; check_in_approved_at: string | null;
  ot_hours: number; ot_approved: boolean; ot_approved_at: string | null;
  notes: string | null;
  early_checkout_requested?: boolean;
  early_checkout_reason?: string | null;
  early_checkout_approved?: boolean;
};

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function ShiftsPage() {
  return (
    <>
      <AdminTopbar
        title="Quản lý Ca & Chấm công"
        subtitle="Cấu hình ca làm · Duyệt đăng ký · Duyệt check-in, về sớm & OT."
      />
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="bg-white border border-hairline">
          <TabsTrigger value="calendar">Lịch Tháng</TabsTrigger>
          <TabsTrigger value="batch">Duyệt Lịch Tháng</TabsTrigger>
          <TabsTrigger value="shifts">Danh mục Ca</TabsTrigger>
          <TabsTrigger value="regs">Duyệt Đăng ký lẻ</TabsTrigger>
          <TabsTrigger value="att">Chấm công & OT</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar"><StaffMonthCalendar /></TabsContent>
        <TabsContent value="batch"><BatchApprovalTab /></TabsContent>
        <TabsContent value="shifts"><ShiftsCrudTab /></TabsContent>
        <TabsContent value="regs"><RegistrationsTab /></TabsContent>
        <TabsContent value="att"><AttendancesTab /></TabsContent>
      </Tabs>
    </>
  );
}

/* ==================== TAB 1 · CRUD SHIFTS ==================== */
function ShiftsCrudTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Shift | null>(null);
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["shifts", "list"],
    queryFn: async (): Promise<Shift[]> => {
      const { data, error } = await supabase.from("shifts")
        .select("*").order("start_time");
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
  });

  const toggleActive = async (s: Shift) => {
    const { error } = await supabase.from("shifts").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["shifts"] });
  };

  const remove = async (s: Shift) => {
    if (!confirm(`Xoá ca "${s.name}"?`)) return;
    const { error } = await supabase.from("shifts").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã xoá ca"); qc.invalidateQueries({ queryKey: ["shifts"] });
  };

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-hairline">
        <div>
          <h3 className="font-black text-lg">Danh mục Ca làm việc</h3>
          <p className="text-xs text-ink-muted">{q.data?.length ?? 0} ca</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="size-4 mr-1.5 inline" /> Thêm ca
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-soft/40 text-left">
            <tr className="text-ink-muted">
              <th className="px-4 py-3 font-bold">Tên ca</th>
              <th className="px-4 py-3 font-bold">Giờ vào</th>
              <th className="px-4 py-3 font-bold">Giờ ra</th>
              <th className="px-4 py-3 font-bold">Mô tả</th>
              <th className="px-4 py-3 font-bold">Kích hoạt</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
            ) : (q.data ?? []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                <Clock className="mx-auto size-8 mb-2 opacity-50" />Chưa có ca nào.</td></tr>
            ) : q.data!.map((s) => (
              <tr key={s.id} className="border-t border-hairline hover:bg-brand-soft/20">
                <td className="px-4 py-3 font-bold">{s.name}</td>
                <td className="px-4 py-3 font-mono">{s.start_time.slice(0, 5)}</td>
                <td className="px-4 py-3 font-mono">{s.end_time.slice(0, 5)}</td>
                <td className="px-4 py-3 text-ink-muted text-xs max-w-md">{s.description ?? "—"}</td>
                <td className="px-4 py-3"><Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} /></td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing(s); setOpen(true); }}
                    className="p-2 hover:bg-brand-soft rounded-md"><Pencil className="size-4" /></button>
                  <button onClick={() => remove(s)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-md"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ShiftFormDialog open={open} onOpenChange={setOpen} editing={editing}
        onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["shifts"] }); }} />
    </section>
  );
}

function ShiftFormDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editing: Shift | null; onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [start, setStart] = useState(editing?.start_time?.slice(0, 5) ?? "08:00");
  const [end, setEnd] = useState(editing?.end_time?.slice(0, 5) ?? "17:00");
  const [desc, setDesc] = useState(editing?.description ?? "");
  const [active, setActive] = useState(editing?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (open) {
      setName(editing?.name ?? "");
      setStart(editing?.start_time?.slice(0, 5) ?? "08:00");
      setEnd(editing?.end_time?.slice(0, 5) ?? "17:00");
      setDesc(editing?.description ?? "");
      setActive(editing?.is_active ?? true);
    }
  }, [open, editing]);

  const submit = async () => {
    if (!name.trim()) { toast.error("Vui lòng nhập tên ca"); return; }
    setSaving(true);
    const payload = { name: name.trim(), start_time: start, end_time: end, description: desc || null, is_active: active };
    const { error } = editing
      ? await supabase.from("shifts").update(payload).eq("id", editing.id)
      : await supabase.from("shifts").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Đã cập nhật ca" : "Đã tạo ca mới");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader><DialogTitle>{editing ? "Sửa ca" : "Thêm ca mới"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tên ca</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ca Sáng" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Giờ bắt đầu</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>Giờ kết thúc</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div><Label>Mô tả</Label><Input value={desc ?? ""} onChange={(e) => setDesc(e.target.value)} placeholder="Ghi chú nội bộ" /></div>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} /><Label>Đang kích hoạt</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== TAB 2 · DUYỆT ĐĂNG KÝ ==================== */
function RegistrationsTab() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const shiftsQ = useQuery({
    queryKey: ["shifts", "map"],
    queryFn: async (): Promise<Record<string, Shift>> => {
      const { data } = await supabase.from("shifts").select("*");
      const m: Record<string, Shift> = {};
      (data ?? []).forEach((s) => { m[s.id] = s as Shift; });
      return m;
    },
  });

  const usersQ = useQuery({
    queryKey: ["users", "all"],
    queryFn: async (): Promise<Record<string, StaffUser>> => {
      const { data } = await supabase.from("users").select("id,full_name,email,role");
      const m: Record<string, StaffUser> = {};
      (data ?? []).forEach((u) => { m[u.id] = u as StaffUser; });
      return m;
    },
  });

  const regsQ = useQuery({
    queryKey: ["shift_regs", date],
    queryFn: async (): Promise<Registration[]> => {
      const { data, error } = await supabase.from("shift_registrations")
        .select("*").eq("date", date).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Registration[];
    },
  });

  const rows = useMemo(() => {
    const um = usersQ.data ?? {};
    return (regsQ.data ?? []).filter((r) => {
      if (!roleFilter) return true;
      return um[r.employee_id]?.role === roleFilter;
    });
  }, [regsQ.data, usersQ.data, roleFilter]);

  const decide = async (r: Registration, status: "approved" | "rejected") => {
    const uid = session?.user.id ?? null;
    const { error } = await supabase.from("shift_registrations").update({
      status,
      approved_by: uid,
      approved_at: new Date().toISOString(),
      note: notes[r.id] ?? r.note,
    }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Đã duyệt" : "Đã từ chối");
    qc.invalidateQueries({ queryKey: ["shift_regs"] });
  };

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="flex flex-wrap items-end gap-3 p-5 border-b border-hairline">
        <div>
          <h3 className="font-black text-lg">Duyệt Đăng ký ca</h3>
          <p className="text-xs text-ink-muted">{rows.length} đăng ký ngày {date}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-end gap-2">
          <div><Label className="text-xs">Ngày</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div>
            <Label className="text-xs">Role</Label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-hairline bg-white text-sm">
              <option value="">Tất cả</option>
              <option value="staff">Staff</option><option value="employee">Employee</option>
              <option value="sale">Sale</option><option value="technician">Technician</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-soft/40 text-left">
            <tr className="text-ink-muted">
              <th className="px-4 py-3 font-bold">Nhân viên</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold">Ca đăng ký</th>
              <th className="px-4 py-3 font-bold">Trạng thái</th>
              <th className="px-4 py-3 font-bold">Ghi chú</th>
              <th className="px-4 py-3 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {regsQ.isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">Không có đăng ký nào.</td></tr>
            ) : rows.map((r) => {
              const u = usersQ.data?.[r.employee_id];
              const s = shiftsQ.data?.[r.shift_id];
              return (
                <tr key={r.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-bold">{u?.full_name ?? u?.email ?? r.employee_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs">{u?.role ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{s?.name ?? "—"}</div>
                    <div className="text-xs text-ink-muted font-mono">{s?.start_time?.slice(0, 5)} – {s?.end_time?.slice(0, 5)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={
                      r.status === "approved" ? "bg-emerald-600 text-white" :
                      r.status === "rejected" ? "bg-red-600 text-white" :
                      "bg-amber-500 text-white"}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Input className="w-48" placeholder="Ghi chú..." defaultValue={r.note ?? ""}
                      onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => decide(r, "approved")} className="mr-2">
                          <Check className="size-3.5 mr-1 inline" />Duyệt
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => decide(r, "rejected")}>
                          <X className="size-3.5 mr-1 inline" />Từ chối
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-ink-muted">
                        Đã xử lý {r.approved_at ? new Date(r.approved_at).toLocaleString("vi-VN") : ""}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ==================== TAB 3 · CHẤM CÔNG & OT ==================== */
function AttendancesTab() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [otDraft, setOtDraft] = useState<Record<string, string>>({});

  const shiftsQ = useQuery({
    queryKey: ["shifts", "map-att"],
    queryFn: async (): Promise<Record<string, Shift>> => {
      const { data } = await supabase.from("shifts").select("*");
      const m: Record<string, Shift> = {};
      (data ?? []).forEach((s) => { m[s.id] = s as Shift; });
      return m;
    },
  });
  const usersQ = useQuery({
    queryKey: ["users", "map-att"],
    queryFn: async (): Promise<Record<string, StaffUser>> => {
      const { data } = await supabase.from("users").select("id,full_name,email,role");
      const m: Record<string, StaffUser> = {};
      (data ?? []).forEach((u) => { m[u.id] = u as StaffUser; });
      return m;
    },
  });
  const attQ = useQuery({
    queryKey: ["attendances", date],
    queryFn: async (): Promise<Attendance[]> => {
      const { data, error } = await supabase.from("attendances")
        .select("*").eq("date", date).order("check_in_time", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
    refetchOnWindowFocus: true,
  });

  const approveCheckIn = async (a: Attendance) => {
    const uid = session?.user.id ?? null;
    const { error } = await supabase.from("attendances").update({
      check_in_approved: true, check_in_approved_by: uid, check_in_approved_at: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã duyệt check-in"); qc.invalidateQueries({ queryKey: ["attendances"] });
  };

  const approveOT = async (a: Attendance) => {
    const raw = otDraft[a.id];
    const hours = raw !== undefined ? Number(raw) : Number(a.ot_hours);
    if (isNaN(hours) || hours < 0) { toast.error("Số giờ OT không hợp lệ"); return; }
    const uid = session?.user.id ?? null;
    const { error } = await supabase.from("attendances").update({
      ot_hours: hours, ot_approved: true, ot_approved_by: uid, ot_approved_at: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Đã duyệt OT ${hours}h`); qc.invalidateQueries({ queryKey: ["attendances"] });
  };

  // LOGIC MỚI: HÀM DUYỆT VỀ SỚM CHO QUẢN LÝ
  const approveEarlyCheckout = async (a: Attendance) => {
    const uid = session?.user.id ?? null;
    const { error } = await supabase.from("attendances").update({
      early_checkout_approved: true,
      early_checkout_approved_by: uid,
      early_checkout_approved_at: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã cấp phép cho nhân viên về sớm!");
    qc.invalidateQueries({ queryKey: ["attendances"] });
  };

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="flex flex-wrap items-end gap-3 p-5 border-b border-hairline">
        <div>
          <h3 className="font-black text-lg">Bảng chấm công & OT</h3>
          <p className="text-xs text-ink-muted">{attQ.data?.length ?? 0} bản ghi ngày {date}</p>
        </div>
        <div className="ml-auto">
          <Label className="text-xs">Ngày</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-soft/40 text-left">
            <tr className="text-ink-muted">
              <th className="px-4 py-3 font-bold">Nhân viên</th>
              <th className="px-4 py-3 font-bold">Ca đăng ký</th>
              <th className="px-4 py-3 font-bold">Check-in</th>
              <th className="px-4 py-3 font-bold">Check-out</th>
              <th className="px-4 py-3 font-bold">Trạng thái</th>
              <th className="px-4 py-3 font-bold">OT (h)</th>
              <th className="px-4 py-3 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {attQ.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
            ) : (attQ.data ?? []).length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                <CalendarCheck2 className="mx-auto size-8 mb-2 opacity-50" />Chưa có bản ghi chấm công.</td></tr>
            ) : attQ.data!.map((a) => {
              const u = usersQ.data?.[a.employee_id];
              const s = a.shift_id ? shiftsQ.data?.[a.shift_id] : null;
              const otVal = otDraft[a.id] ?? String(a.ot_hours);
              return (
                <tr key={a.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-bold">{u?.full_name ?? u?.email ?? a.employee_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs">
                    {s ? <><b>{s.name}</b> <span className="text-ink-muted font-mono">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span></> : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {a.check_in_approved
                      ? <Badge className="bg-emerald-600 text-white"><ShieldCheck className="size-3 mr-1 inline" />Đã duyệt CI</Badge>
                      : <Badge className="bg-amber-500 text-white">Chờ duyệt CI</Badge>}
                    
                    {/* BỔ SUNG HIỂN THỊ YÊU CẦU VỀ SỚM Ở CỘT TRẠNG THÁI */}
                    {a.early_checkout_requested && !a.early_checkout_approved && (
                      <div className="mt-1.5 p-1 bg-red-50 text-[10px] text-red-600 border border-red-200 rounded leading-tight">
                        <b>Xin về sớm:</b> {a.early_checkout_reason}
                      </div>
                    )}
                    {a.early_checkout_approved && (
                      <div className="mt-1.5 text-[10px] text-emerald-600 font-bold">
                        ✓ Đã cho phép về sớm
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Input type="number" step="0.25" min={0} className="w-20"
                      value={otVal}
                      onChange={(e) => setOtDraft((p) => ({ ...p, [a.id]: e.target.value }))} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                    {/* BỔ SUNG NÚT DUYỆT VỀ SỚM CHO QUẢN LÝ */}
                    {a.early_checkout_requested && !a.early_checkout_approved && !a.check_out_time && (
                      <Button size="sm" onClick={() => approveEarlyCheckout(a)}
                        className="bg-red-500 hover:bg-red-600 text-white">
                        Duyệt về sớm
                      </Button>
                    )}
                    {!a.check_in_approved && (
                      <Button size="sm" onClick={() => approveCheckIn(a)}
                        className="bg-amber-500 hover:bg-amber-600 text-white">
                        Duyệt Check-in
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => approveOT(a)}
                      disabled={a.ot_approved && (otDraft[a.id] === undefined)}>
                      {a.ot_approved && otDraft[a.id] === undefined ? "OT đã duyệt" : "Duyệt OT"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
