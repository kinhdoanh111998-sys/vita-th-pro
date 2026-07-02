import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Users, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type BatchRequest = {
  id: string; staff_id: string; month: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null; reviewed_at: string | null;
  created_at: string;
};
type ShiftRow = {
  id: string; date: string; shift_type: "sang" | "chieu" | "ca_ngay";
  request_batch_id: string | null; status: string;
};
type UserInfo = { id: string; full_name: string | null; email: string; role: string };

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const shiftShort = (t: string) => t === "sang" ? "Sáng" : t === "chieu" ? "Chiều" : "Cả ngày";

function summarize(rows: ShiftRow[]): string {
  if (!rows.length) return "Không có ngày làm";
  const byDow: Record<string, string[]> = {};
  rows.forEach((r) => {
    const d = new Date(r.date + "T00:00:00");
    const k = DOW[d.getDay()];
    (byDow[k] ??= []).push(shiftShort(r.shift_type));
  });
  return ["T2","T3","T4","T5","T6","T7","CN"]
    .filter((k) => byDow[k])
    .map((k) => `${k}: ${Array.from(new Set(byDow[k])).join("+")}`)
    .join(" · ");
}

export function BatchApprovalTab() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const requestsQ = useQuery({
    queryKey: ["batch-requests", "pending"],
    queryFn: async (): Promise<BatchRequest[]> => {
      try {
        const { data, error } = await supabase
          .from("shift_approval_requests")
          .select("id,staff_id,month,status,review_note,reviewed_at,created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as BatchRequest[];
      } catch (e) { console.error("[batch requests]", e); return []; }
    },
  });

  const ids = requestsQ.data?.map((r) => r.id) ?? [];
  const staffIds = Array.from(new Set(requestsQ.data?.map((r) => r.staff_id) ?? []));

  const shiftsQ = useQuery({
    queryKey: ["batch-shifts", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, ShiftRow[]>> => {
      try {
        const { data, error } = await supabase
          .from("staff_shifts")
          .select("id,date,shift_type,request_batch_id,status")
          .in("request_batch_id", ids);
        if (error) throw error;
        const m: Record<string, ShiftRow[]> = {};
        (data ?? []).forEach((s: any) => {
          if (s.request_batch_id) (m[s.request_batch_id] ??= []).push(s);
        });
        return m;
      } catch (e) { console.error("[batch shifts]", e); return {}; }
    },
  });

  const usersQ = useQuery({
    queryKey: ["batch-users", staffIds.join(",")],
    enabled: staffIds.length > 0,
    queryFn: async (): Promise<Record<string, UserInfo>> => {
      try {
        const { data, error } = await supabase.from("users")
          .select("id,full_name,email,role").in("id", staffIds);
        if (error) throw error;
        const m: Record<string, UserInfo> = {};
        (data ?? []).forEach((u: any) => { m[u.id] = u; });
        return m;
      } catch (e) { console.error("[batch users]", e); return {}; }
    },
  });

  const decide = async (r: BatchRequest, next: "approved" | "rejected") => {
    setBusy(r.id);
    try {
      const nowIso = new Date().toISOString();
      const uid = session?.user.id ?? null;
      const { error: uErr } = await supabase.from("shift_approval_requests").update({
        status: next,
        reviewed_by: uid,
        reviewed_at: nowIso,
        review_note: note[r.id] ?? r.review_note ?? null,
      }).eq("id", r.id);
      if (uErr) throw uErr;

      const { error: sErr } = await supabase.from("staff_shifts").update({ status: next })
        .eq("request_batch_id", r.id);
      if (sErr) throw sErr;

      // Notify staff
      try {
        await supabase.from("notifications").insert({
          recipient_id: r.staff_id,
          actor_id: uid,
          type: next === "approved" ? "shift_request_approved" : "shift_request_rejected",
          title: next === "approved" ? "Lịch làm việc đã được duyệt" : "Lịch làm việc bị từ chối",
          body: next === "approved"
            ? `Đăng ký lịch tháng ${r.month} đã được duyệt.`
            : `Đăng ký lịch tháng ${r.month} bị từ chối. ${note[r.id] ? "Ghi chú: " + note[r.id] : "Vui lòng cấu hình lại."}`,
          ref_type: "shift_approval_request",
          ref_id: r.id,
        });
      } catch (nerr) { console.warn("[notify staff]", nerr); }

      toast.success(next === "approved" ? "Đã duyệt lịch" : "Đã từ chối lịch");
      await qc.invalidateQueries({ queryKey: ["batch-requests"] });
      await qc.invalidateQueries({ queryKey: ["staff-shifts-month"] });
    } catch (e: any) {
      console.error("[decide]", e);
      toast.error(e?.message ?? "Không cập nhật được");
    } finally {
      setBusy(null);
    }
  };

  const rows = requestsQ.data ?? [];

  return (
    <section className="bg-white border border-hairline rounded-2xl shadow-sm">
      <div className="p-5 border-b border-hairline flex items-center gap-3">
        <div>
          <h3 className="font-black text-lg flex items-center gap-2">
            <CalendarIcon className="size-5" /> Duyệt Lịch Tháng (Batch)
          </h3>
          <p className="text-xs text-ink-muted">
            {requestsQ.isLoading ? "Đang tải..." : `${rows.length} yêu cầu đang chờ duyệt`}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-ink-muted">
          <Users className="mx-auto size-8 mb-2 opacity-50" />
          Không có yêu cầu đăng ký nào đang chờ.
        </div>
      ) : (
        <div className="divide-y divide-hairline">
          {rows.map((r) => {
            const u = usersQ.data?.[r.staff_id];
            const shifts = shiftsQ.data?.[r.id] ?? [];
            const summary = summarize(shifts);
            return (
              <div key={r.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <div className="font-black text-brand-dark">
                      {u?.full_name ?? u?.email ?? r.staff_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-ink-muted">
                      Vai trò: <b>{u?.role ?? "—"}</b> · Tháng <b>{r.month}</b> · Gửi {new Date(r.created_at).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <Badge className="bg-amber-500 text-white ml-auto">Chờ duyệt</Badge>
                </div>
                <div className="text-sm bg-brand-soft/40 rounded-md p-3">
                  <div className="font-bold mb-1">Tổng {shifts.length} ngày làm việc</div>
                  <div className="text-ink-muted">{summary}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input className="max-w-md" placeholder="Ghi chú duyệt/từ chối..."
                    onChange={(e) => setNote((p) => ({ ...p, [r.id]: e.target.value }))} />
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" onClick={() => decide(r, "approved")} disabled={busy === r.id}>
                      <Check className="size-3.5 mr-1 inline" /> Duyệt lịch
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(r, "rejected")} disabled={busy === r.id}>
                      <X className="size-3.5 mr-1 inline" /> Từ chối
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
