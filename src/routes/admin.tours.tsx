import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/tours")({
  component: ToursPage,
});

type Option = { id: string; label: string; sub?: string };
type TreatmentOpt = Option & { remaining?: number; used?: number };

function ToursPage() {
  const [customers, setCustomers] = useState<Option[]>([]);
  const [treatments, setTreatments] = useState<TreatmentOpt[]>([]);
  const [technicians, setTechnicians] = useState<Option[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionAmount, setCommissionAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [c, t, e] = await Promise.all([
        supabase.from("customers").select("id,name,phone"),
        supabase
          .from("treatments")
          .select("id,package_name,customer_id,used_sessions,remaining_sessions,status"),
        supabase.from("users").select("id,full_name,role"),
      ]);
      if (c.error || t.error || e.error) {
        setLoadError(c.error?.message || t.error?.message || e.error?.message || null);
      }
      setCustomers(
        (c.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          label: String(r.name ?? "—"),
          sub: r.phone ? String(r.phone) : undefined,
        })),
      );
      setTreatments(
        (t.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          label: String(r.package_name ?? "Liệu trình"),
          sub: `Còn ${r.remaining_sessions ?? 0} buổi`,
          remaining: Number(r.remaining_sessions ?? 0),
          used: Number(r.used_sessions ?? 0),
          customer_id: r.customer_id ? String(r.customer_id) : undefined,
        })) as TreatmentOpt[],
      );
      setTechnicians(
        (e.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          label: String(r.full_name ?? "—"),
          sub: r.role ? String(r.role) : undefined,
        })),
      );
    })();
  }, []);

  const selectedTreatment = useMemo(
    () => treatments.find((x) => x.id === treatmentId),
    [treatments, treatmentId],
  );

  // ====== HÀM LOGIC CHUẨN – KHÔNG ĐƯỢC THAY ĐỔI ======
  const handleCompleteTour = async (
    treatmentId: string,
    customerId: string,
    technicianId: string,
    notes: string,
    commissionAmount: number,
  ) => {
    try {
      // Bước 1: Ghi nhận Ca làm (Tour) mới vào Database
      const { data: tourData, error: tourError } = await supabase
        .from("tours")
        .insert([
          {
            treatment_id: treatmentId,
            customer_id: customerId,
            technician_id: technicianId,
            notes: notes,
            status: "completed",
          },
        ])
        .select()
        .single();
      if (tourError) throw tourError;

      // Bước 2: Cập nhật (Trừ đi 1 buổi) trong bảng Liệu trình (Treatments)
      const { data: treatmentData, error: fetchError } = await supabase
        .from("treatments")
        .select("used_sessions, remaining_sessions")
        .eq("id", treatmentId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("treatments")
        .update({
          used_sessions: treatmentData.used_sessions + 1,
          remaining_sessions: treatmentData.remaining_sessions - 1,
          status: treatmentData.remaining_sessions - 1 === 0 ? "completed" : "active",
        })
        .eq("id", treatmentId);
      if (updateError) throw updateError;

      // Bước 3: Ghi nhận Hoa hồng cho Kỹ thuật viên
      const { error: commissionError } = await supabase.from("commissions").insert([
        {
          staff_id: technicianId,
          commission_type: "tour_service",
          reference_id: tourData.id,
          amount: commissionAmount,
          status: "pending",
        },
      ]);
      if (commissionError) throw commissionError;

      alert("Hoàn thành ca làm thành công! Đã tự động trừ buổi và tính hoa hồng.");
    } catch (error) {
      console.error("Lỗi khi xử lý Tour:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };
  // ====== HẾT HÀM LOGIC CHUẨN ======

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentId || !customerId || !technicianId) {
      alert("Vui lòng chọn đầy đủ khách hàng, liệu trình và kỹ thuật viên.");
      return;
    }
    setSubmitting(true);
    await handleCompleteTour(
      treatmentId,
      customerId,
      technicianId,
      notes,
      Number(commissionAmount || 0),
    );
    setSubmitting(false);
    setNotes("");
    setCommissionAmount("");
  };

  return (
    <>
      <AdminTopbar
        title="Quản lý Ca làm (Tours)"
        subtitle="Ghi nhận ca làm, tự động trừ buổi liệu trình và tính hoa hồng kỹ thuật viên."
      />

      {loadError && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {loadError}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <form
          onSubmit={onSubmit}
          className="lg:col-span-2 bg-white border border-hairline rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-hairline">
            <div className="size-10 grid place-items-center rounded-xl bg-brand-soft text-brand-dark text-lg font-black">
              T
            </div>
            <div>
              <h2 className="font-black text-lg">Tạo ca làm mới</h2>
              <p className="text-xs text-ink-muted">
                Chọn khách – liệu trình – kỹ thuật viên rồi bấm Hoàn thành.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Khách hàng *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                      {o.sub ? ` · ${o.sub}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Liệu trình *</Label>
              <Select value={treatmentId} onValueChange={setTreatmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn liệu trình" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label} · {o.sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Kỹ thuật viên *</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỹ thuật viên" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                      {o.sub ? ` · ${o.sub}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Hoa hồng (VND)</Label>
              <Input
                type="number"
                min={0}
                placeholder="VD: 50000"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú ca làm</Label>
            <Textarea
              rows={4}
              placeholder="Tình trạng da, phản hồi khách, lưu ý buổi sau..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCustomerId("");
                setTreatmentId("");
                setTechnicianId("");
                setNotes("");
                setCommissionAmount("");
              }}
            >
              Làm mới
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "✓ Hoàn thành Ca làm"}
            </Button>
          </div>
        </form>

        <aside className="bg-gradient-to-br from-brand-soft to-white border border-hairline rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-base">Tóm tắt ca làm</h3>
          <Row label="Khách hàng" value={customers.find((x) => x.id === customerId)?.label} />
          <Row label="Liệu trình" value={selectedTreatment?.label} />
          <Row
            label="Buổi còn lại"
            value={
              selectedTreatment
                ? `${selectedTreatment.remaining} → ${Math.max(0, (selectedTreatment.remaining ?? 0) - 1)}`
                : undefined
            }
          />
          <Row label="Kỹ thuật viên" value={technicians.find((x) => x.id === technicianId)?.label} />
          <Row
            label="Hoa hồng"
            value={
              commissionAmount
                ? Number(commissionAmount).toLocaleString("vi-VN") + " ₫"
                : undefined
            }
          />
          <div className="pt-3 mt-3 border-t border-hairline text-xs text-ink-muted leading-relaxed">
            Khi bấm <b className="text-brand-dark">Hoàn thành</b>, hệ thống tạo tour, trừ 1 buổi
            liệu trình và ghi nhận hoa hồng (trạng thái <i>pending</i>).
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-bold text-right">{value || "—"}</span>
    </div>
  );
}
