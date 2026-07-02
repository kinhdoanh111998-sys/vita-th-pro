import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RotateCcw, Camera, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
type Service = { id: string; name: string };
type ActiveTour = {
  id: string;
  technician_id: string;
  commission_amount: number | null;
  start_time: string | null;
};

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
      tour: ActiveTour;
      technicianName: string;
    };

function ScanPage() {
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef<any>(null);
  const stateRef = useRef<ScanState>(state);
  stateRef.current = state;

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
      if (treatment.status === "completed") {
        setState({
          kind: "error",
          message: `Buổi #${treatment.session_number} đã hoàn tất trước đó.`,
        });
        return;
      }

      // Tìm tour đang chạy (in_progress) cho buổi này — do QL đã xếp
      const { data: tourRow, error: tourErr } = await supabase
        .from("tours")
        .select("id,technician_id,commission_amount,start_time")
        .eq("treatment_id", treatment.id)
        .eq("status", "in_progress")
        .maybeSingle();
      if (tourErr) throw tourErr;
      if (!tourRow) {
        setState({
          kind: "error",
          message: "Chưa có ca đang thực hiện cho buổi này. Yêu cầu Quản lý xếp ca trước.",
        });
        return;
      }
      const tour = tourRow as ActiveTour;

      const [{ data: cust }, { data: ord }, { data: staff }] = await Promise.all([
        supabase.from("customers").select("id,name,phone").eq("id", treatment.customer_id).maybeSingle(),
        supabase.from("orders").select("service_id").eq("id", treatment.order_id).maybeSingle(),
        supabase.from("users").select("full_name").eq("id", tour.technician_id).maybeSingle(),
      ]);

      let service: Service | null = null;
      if (ord?.service_id) {
        const { data: svc } = await supabase
          .from("services")
          .select("id,name")
          .eq("id", ord.service_id)
          .maybeSingle();
        service = (svc as Service) ?? null;
      }

      setState({
        kind: "match",
        treatment,
        customer: (cust as Customer) ?? null,
        service,
        tour,
        technicianName: (staff as any)?.full_name ?? "—",
      });
    } catch (e: any) {
      setState({ kind: "error", message: e?.message ?? "Không thể tra cứu mã QR." });
    }
  };

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
        (decoded) => { handleCode(decoded); },
        () => { /* miss */ },
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
    } catch { /* noop */ }
    scannerRef.current = null;
  };

  useEffect(() => () => { stopScanner(); }, []);
  useEffect(() => {
    if (state.kind === "match" || state.kind === "error") stopScanner();
  }, [state.kind]);

  const resetAndScan = async () => {
    await stopScanner();
    setNotes("");
    startScanner();
  };

  const confirmFinish = async () => {
    if (state.kind !== "match") return;
    setSubmitting(true);
    const tr = state.treatment;
    const tour = state.tour;
    try {
      // 1. Đóng Tour
      const { error: tourErr } = await supabase
        .from("tours")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
          notes: notes.trim() || null,
        })
        .eq("id", tour.id)
        .eq("status", "in_progress"); // guard chống double-scan
      if (tourErr) throw tourErr;

      // 2. Đánh dấu buổi hoàn thành
      const { error: upErr } = await supabase
        .from("treatments")
        .update({ status: "completed" })
        .eq("id", tr.id);
      if (upErr) throw upErr;

      // 3. Ghi nhận hoa hồng (nếu > 0)
      const amount = Number(tour.commission_amount) || 0;
      if (amount > 0) {
        await supabase.from("commissions").insert({
          staff_id: tour.technician_id,
          commission_type: "tour_service",
          reference_id: tour.id,
          amount,
          status: "pending",
        });
      }

      // 4. Thông báo NV — nay đã khả dụng lại
      await supabase.from("notifications").insert({
        recipient_id: tour.technician_id,
        type: "tour_completed",
        title: "Đã kết thúc ca — Bạn đã khả dụng",
        body: `Buổi #${tr.session_number} · ${state.customer?.name ?? "Khách"}`,
        ref_type: "tour",
        ref_id: tour.id,
      });

      toast.success(`Đã xác nhận kết thúc buổi #${tr.session_number}!`);
      setState({ kind: "idle" });
      setNotes("");
    } catch (e: any) {
      toast.error(e?.message ?? "Không thể xác nhận kết thúc.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-gray-950" />

      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white">Quét QR kết thúc ca</h1>
        <p className="text-xs text-gray-400 mt-1">
          NV quét mã QR khách để xác nhận buổi đã hoàn tất
        </p>
      </div>

      <div className="relative z-10 mx-auto max-w-[360px] px-4">
        <div
          id={REGION_ID}
          className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-900 ring-1 ring-white/10"
        />
        {state.kind === "scanning" && (
          <div className="pointer-events-none absolute inset-x-4 top-0 aspect-square">
            <span className="absolute top-0 left-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-brand" />
            <span className="absolute top-0 right-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-brand" />
            <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-brand" />
            <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-brand" />
          </div>
        )}
      </div>

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
                  <CheckCircle2 className="w-5 h-5" /> Xác nhận kết thúc ca
                </DialogTitle>
                <DialogDescription>
                  Kiểm tra lại thông tin trước khi đóng ca &amp; ghi nhận hoa hồng.
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
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Kỹ thuật viên</span>
                  <span className="font-semibold text-ink">{state.technicianName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Hoa hồng</span>
                  <span className="font-semibold text-ink">
                    {(Number(state.tour.commission_amount) || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <Label>Ghi chú buổi</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tình trạng da, phản hồi khách…"
                />
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
                  onClick={confirmFinish}
                  disabled={submitting}
                  className="bg-brand hover:bg-brand-dark"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  {submitting ? "Đang lưu…" : "Xác nhận kết thúc"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

