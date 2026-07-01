import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RotateCcw, Camera, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/scan")({
  component: ScanPage,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REGION_ID = "vita-qr-reader";

type Treatment = {
  id: string;
  order_id: string;
  customer_id: string;
  session_number: number;
  status: string;
  qr_code_id: string;
};
type Customer = { id: string; name: string | null; phone: string | null };
type Order = { id: string; service_id: string; quantity: number };
type Service = { id: string; name: string; default_sessions: number | null };
type Staff = { id: string; full_name: string | null; role: string };

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "loading"; code: string }
  | { kind: "error"; message: string }
  | {
      kind: "match";
      treatment: Treatment;
      customer: Customer | null;
      service: Service | null;
      order: Order | null;
      totalSessions: number | null;
    };

function ScanPage() {
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [technicianId, setTechnicianId] = useState<string>("");
  const [commissionAmount, setCommissionAmount] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef<any>(null);
  const stateRef = useRef<ScanState>(state);
  stateRef.current = state;

  const staffQ = useQuery({
    queryKey: ["scan-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id,full_name,role")
        .in("role", ["admin", "staff", "manager"])
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Staff[];
    },
  });

  const handleCode = async (raw: string) => {
    const code = raw.trim();
    if (!UUID_RE.test(code)) {
      setState({ kind: "error", message: "Mã QR không hợp lệ." });
      return;
    }
    if (stateRef.current.kind === "loading" || stateRef.current.kind === "match") return;
    setState({ kind: "loading", code });

    try {
      const { data: t, error: tErr } = await supabase
        .from("treatments")
        .select("id,order_id,customer_id,session_number,status,qr_code_id")
        .eq("qr_code_id", code)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!t) {
        setState({ kind: "error", message: "Không tìm thấy liệu trình cho mã này." });
        return;
      }
      const treatment = t as Treatment;
      if (treatment.status !== "pending") {
        setState({
          kind: "error",
          message: `Buổi #${treatment.session_number} đã được sử dụng trước đó.`,
        });
        return;
      }

      const [{ data: cust }, { data: ord }] = await Promise.all([
        supabase.from("customers").select("id,name,phone").eq("id", treatment.customer_id).maybeSingle(),
        supabase.from("orders").select("id,service_id,quantity").eq("id", treatment.order_id).maybeSingle(),
      ]);

      let service: Service | null = null;
      if (ord?.service_id) {
        const { data: svc } = await supabase
          .from("services")
          .select("id,name,default_sessions")
          .eq("id", ord.service_id)
          .maybeSingle();
        service = (svc as Service) ?? null;
      }

      const totalSessions =
        ord && service
          ? Math.max((ord as Order).quantity, 1) * Math.max(service.default_sessions ?? 1, 1)
          : null;

      setState({
        kind: "match",
        treatment,
        customer: (cust as Customer) ?? null,
        order: (ord as Order) ?? null,
        service,
        totalSessions,
      });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Không thể tra cứu mã QR." });
    }
  };

  // Start camera scanner
  const startScanner = async () => {
    setState({ kind: "scanning" });
    try {
      const mod = await import("html5-qrcode");
      const { Html5Qrcode } = mod;
      const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          handleCode(decoded);
        },
        () => {
          /* per-frame decode misses, ignore */
        },
      );
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Không thể mở camera. Cấp quyền và thử lại." });
    }
  };

  const stopScanner = async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      if (s.isScanning) await s.stop();
      await s.clear();
    } catch {
      /* noop */
    }
    scannerRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Stop the camera as soon as we have a match to avoid re-triggering.
  useEffect(() => {
    if (state.kind === "match" || state.kind === "error") {
      stopScanner();
    }
  }, [state.kind]);

  const resetAndScan = async () => {
    await stopScanner();
    setTechnicianId("");
    setCommissionAmount("0");
    setNotes("");
    startScanner();
  };

  const confirmCheckin = async () => {
    if (state.kind !== "match") return;
    if (!technicianId) {
      toast.error("Vui lòng chọn kỹ thuật viên phụ trách.");
      return;
    }
    setSubmitting(true);
    const amount = Number(commissionAmount) || 0;
    const tr = state.treatment;
    try {
      // 1. Đánh dấu buổi hoàn thành
      const { error: upErr } = await supabase
        .from("treatments")
        .update({ status: "completed" })
        .eq("id", tr.id)
        .eq("status", "pending"); // guard chống double-scan
      if (upErr) throw upErr;

      // 2. Ghi nhận Ca làm (Tour)
      const { error: tourErr } = await supabase.from("tours").insert({
        treatment_id: tr.id,
        customer_id: tr.customer_id,
        technician_id: technicianId,
        commission_amount: amount,
        notes: notes.trim() || null,
        status: "completed",
      });
      if (tourErr) throw tourErr;

      // 3. Ghi nhận Hoa hồng (nếu > 0)
      if (amount > 0) {
        const { error: cErr } = await supabase.from("commissions").insert({
          staff_id: technicianId,
          commission_type: "service",
          reference_id: tr.id,
          amount,
          status: "pending",
        });
        if (cErr) throw cErr;
      }

      toast.success(`Check-in thành công buổi #${tr.session_number}!`);
      setState({ kind: "idle" });
      setTechnicianId("");
      setCommissionAmount("0");
      setNotes("");
    } catch (e: any) {
      toast.error(e?.message ?? "Không thể hoàn tất check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />

      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white">Quét mã QR check-in</h1>
        <p className="text-xs text-gray-400 mt-1">Kỹ thuật viên quét mã của khách để trừ buổi</p>
      </div>

      {/* Camera region */}
      <div className="relative z-10 mx-auto max-w-[360px] px-4">
        <div
          id={REGION_ID}
          className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-900 ring-1 ring-white/10"
        />
        {/* Corner brackets overlay */}
        {state.kind === "scanning" && (
          <div className="pointer-events-none absolute inset-x-4 top-0 aspect-square">
            <span className="absolute top-0 left-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-brand" />
            <span className="absolute top-0 right-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-brand" />
            <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-brand" />
            <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-brand" />
          </div>
        )}
      </div>

      {/* Action panel */}
      <div className="relative z-10 mx-auto max-w-[360px] px-4 mt-4 pb-8">
        {state.kind === "idle" && (
          <Button onClick={startScanner} size="lg" className="w-full bg-brand hover:bg-brand-dark">
            <Camera className="w-5 h-5 mr-2" /> Bật camera & Quét
          </Button>
        )}
        {state.kind === "scanning" && (
          <div className="space-y-2">
            <p className="text-center text-sm text-gray-300">Đưa mã QR của khách vào khung hình…</p>
            <Button variant="secondary" onClick={() => stopScanner().then(() => setState({ kind: "idle" }))} className="w-full">
              Dừng
            </Button>
          </div>
        )}
        {state.kind === "loading" && (
          <p className="text-center text-sm text-gray-300">Đang tra cứu mã…</p>
        )}
        {state.kind === "error" && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-100 text-center space-y-3">
            <XCircle className="w-8 h-8 mx-auto text-red-400" />
            <div className="text-sm">{state.message}</div>
            <Button onClick={resetAndScan} className="w-full bg-white text-black hover:bg-gray-200">
              <RotateCcw className="w-4 h-4 mr-2" /> Quét lại
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={state.kind === "match"}
        onOpenChange={(open) => {
          if (!open && !submitting) setState({ kind: "idle" });
        }}
      >
        <DialogContent className="max-w-md">
          {state.kind === "match" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" /> Xác nhận check-in
                </DialogTitle>
                <DialogDescription>
                  Kiểm tra thông tin buổi trước khi trừ khỏi liệu trình.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl bg-[#f7faf5] p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Khách hàng</span>
                  <span className="font-semibold text-ink">
                    {state.customer?.name ?? "—"}
                    {state.customer?.phone ? ` · ${state.customer.phone}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Dịch vụ</span>
                  <span className="font-semibold text-ink">{state.service?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Buổi</span>
                  <span className="font-semibold text-brand-dark">
                    #{state.treatment.session_number}
                    {state.totalSessions ? ` / ${state.totalSessions}` : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mt-2">
                <div>
                  <Label>Kỹ thuật viên phụ trách *</Label>
                  <Select value={technicianId} onValueChange={setTechnicianId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {(staffQ.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name ?? "(chưa đặt tên)"} — {s.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hoa hồng (VND)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ghi chú buổi</Label>
                  <Textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tình trạng da, phản hồi khách…"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setState({ kind: "idle" })}
                  disabled={submitting}
                >
                  Huỷ
                </Button>
                <Button
                  onClick={confirmCheckin}
                  disabled={submitting}
                  className="bg-brand hover:bg-brand-dark"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {submitting ? "Đang lưu…" : "Xác nhận & Trừ buổi"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
