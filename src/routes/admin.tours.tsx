import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";
import { Search, X, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DraggableStaff, type StaffMember } from "@/components/StaffDragDropBoard";
import { AssignDndProvider } from "@/components/AssignDndProvider";
import { CustomerPicker } from "@/components/CustomerPicker";
import { nextInLineTreatments } from "@/lib/nextInLineTreatments";

export const Route = createFileRoute("/admin/tours")({
  component: ToursPage,
});

type Customer = { id: string; name: string | null; phone: string | null };
type UserRow = { id: string; full_name: string | null; role: string | null };
type Treatment = {
  id: string; order_id: string; customer_id: string; session_number: number;
  status: string; service_id: string | null;
};
type Service = { id: string; name: string; price: number | null; type: string | null; is_hidden: boolean | null };
type Attendance = { employee_id: string; check_in_approved: boolean; check_out_time: string | null };
type TourRow = {
  id: string; treatment_id: string; customer_id: string; technician_id: string;
  notes: string | null; commission_amount: number | null; status: string; created_at: string;
};

const STAFF_ROLES = ["staff", "technician", "sale"];
const todayISO = () => new Date().toISOString().slice(0, 10);
const DEFAULT_COMMISSION_RATE = 0.1; // 10% giá dịch vụ

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase() || "?";
}

/** Vùng thả nhân viên — nằm bên dưới input "Nhân viên thực hiện". */
function StaffDropZone({
  onDropStaff,
  currentName,
  onClear,
}: {
  onDropStaff: (id: string) => void;
  currentName: string | null;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "tour-staff-dropzone",
    data: { targetId: "tour-staff-dropzone", onDropStaff },
  });

  return (
    <div
      ref={setNodeRef}
      className={`mt-2 flex items-center gap-2 rounded-xl border-2 border-dashed p-3 min-h-[54px] transition ${
        isOver ? "border-brand-primary bg-brand-soft/50" : "border-hairline bg-[#fafcf7]"
      }`}
    >
      {currentName ? (
        <>
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand-soft text-brand-dark text-[11px] font-bold">
              {initials(currentName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-sm font-bold">{currentName}</div>
          <button
            type="button"
            onClick={onClear}
            className="text-ink-muted hover:text-rose-600"
            aria-label="Bỏ chọn"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <div className="text-xs text-ink-muted italic flex items-center gap-2">
          <UserIcon size={14} />
          Kéo thẻ nhân viên từ cột phải thả vào đây, hoặc chọn ở dropdown bên trên.
        </div>
      )}
    </div>
  );
}

function ToursPage() {
  const qc = useQueryClient();
  const today = todayISO();

  const customersQ = useQuery({
    queryKey: ["tours2", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name,phone").order("name");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["tours2", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name,role");
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });
  const treatmentsQ = useQuery({
    queryKey: ["tours2", "treatments-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id,order_id,customer_id,session_number,status,service_id")
        .in("status", ["pending", "in_progress"])
        .order("session_number");
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });
  const servicesQ = useQuery({
    queryKey: ["tours2", "services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,price,type,is_hidden")
        .neq("type", "product") // Ẩn Sản phẩm — ca làm chỉ áp dụng cho Dịch vụ
        .order("name");
      if (error) throw error;
      return ((data ?? []) as Service[]).filter((s) => !s.is_hidden);
    },
  });
  const attQ = useQuery({
    queryKey: ["tours2", "attendances", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendances")
        .select("employee_id,check_in_approved,check_out_time")
        .eq("date", today);
      if (error) throw error;
      return (data ?? []) as Attendance[];
    },
  });
  const activeToursQ = useQuery({
    queryKey: ["tours2", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("technician_id,status")
        .eq("status", "in_progress");
      if (error) throw error;
      return (data ?? []) as { technician_id: string; status: string }[];
    },
  });

  const serviceMap = useMemo(
    () => new Map((servicesQ.data ?? []).map((s) => [s.id, s])),
    [servicesQ.data],
  );
  const customerMap = useMemo(
    () => new Map((customersQ.data ?? []).map((c) => [c.id, c])),
    [customersQ.data],
  );
  const userMap = useMemo(
    () => new Map((usersQ.data ?? []).map((u) => [u.id, u])),
    [usersQ.data],
  );

  const busySet = useMemo(
    () => new Set((activeToursQ.data ?? []).map((t) => t.technician_id)),
    [activeToursQ.data],
  );
  const availableStaff: StaffMember[] = useMemo(() => {
    const attMap = new Map((attQ.data ?? []).map((a) => [a.employee_id, a]));
    return (usersQ.data ?? [])
      .filter((u) => u.role && STAFF_ROLES.includes(u.role))
      .filter((u) => !busySet.has(u.id)) // Ẩn NV đang thực hiện ca khác
      .map((u) => {
        const a = attMap.get(u.id);
        const checkedIn = !!a?.check_in_approved && !a?.check_out_time;
        return {
          id: u.id,
          full_name: u.full_name ?? "—",
          role: u.role ?? "staff",
          meta: checkedIn ? "Sẵn sàng" : "Chưa check-in",
        };
      });
  }, [usersQ.data, attQ.data, busySet]);

  /* -------- Form state -------- */
  const [customerId, setCustomerId] = useState("__new");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [treatmentId, setTreatmentId] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [salesStaffId, setSalesStaffId] = useState<string>(""); // Người bán (chỉ dùng khi mode='new')
  const [notes, setNotes] = useState("");
  const [commissionAmount, setCommissionAmount] = useState<string>("");
  const [commissionEdited, setCommissionEdited] = useState(false);
  const [staffQ, setStaffQ] = useState("");

  // Chỉ hiển thị buổi kế tiếp (next-in-line) cho từng thẻ liệu trình
  const treatmentsForCustomer = useMemo(
    () => nextInLineTreatments(treatmentsQ.data, customerId && customerId !== "__new" ? customerId : null),
    [treatmentsQ.data, customerId],
  );

  const selectedTreatment = treatmentsForCustomer.find((t) => t.id === treatmentId) ?? null;
  const selectedService = mode === "new"
    ? (newServiceId ? serviceMap.get(newServiceId) ?? null : null)
    : (selectedTreatment?.service_id ? serviceMap.get(selectedTreatment.service_id) ?? null : null);

  // Tự động điền hoa hồng mặc định = 10% giá dịch vụ, admin có thể sửa lại
  useEffect(() => {
    if (commissionEdited) return;
    if (selectedService?.price) {
      const suggested = Math.round(Number(selectedService.price) * DEFAULT_COMMISSION_RATE);
      setCommissionAmount(String(suggested));
    } else {
      setCommissionAmount("20000");
    }
  }, [selectedService, commissionEdited]);

  const resetForm = () => {
    setCustomerId("__new");
    setMode("existing");
    setTreatmentId("");
    setNewServiceId("");
    setTechnicianId("");
    setSalesStaffId("");
    setNotes("");
    setCommissionAmount("");
    setCommissionEdited(false);
  };

  const filteredStaff = availableStaff.filter((s) =>
    !staffQ.trim() ? true : s.full_name.toLowerCase().includes(staffQ.trim().toLowerCase()),
  );

  const complete = useMutation({
    mutationFn: async () => {
      if (!customerId || customerId === "__new") throw new Error("Chọn hoặc tạo khách trước.");
      if (!technicianId) throw new Error("Chọn nhân viên.");
      if (busySet.has(technicianId)) {
        throw new Error("Nhân viên đang thực hiện ca khác — chưa thể xếp thêm.");
      }

      let finalTreatmentId = treatmentId;

      if (mode === "new") {
        // Khách chọn "Dịch vụ mới" — tạo order + để trigger auto-generate treatments
        if (!newServiceId) throw new Error("Chọn dịch vụ mới.");
        const svc = serviceMap.get(newServiceId);
        const price = Number(svc?.price ?? 0);
        const { data: order, error: oErr } = await supabase.from("orders").insert({
          customer_id: customerId,
          service_id: newServiceId,
          quantity: 1,
          subtotal_amount: price,
          discount_amount: 0,
          total_amount: price,
          status: "paid",
          sales_staff_id: salesStaffId || null, // Người bán để tính hoa hồng dịch vụ
        }).select("id").single();
        if (oErr) throw oErr;

        // Lấy treatment #1 vừa được trigger tạo
        const { data: firstTr, error: tErr } = await supabase
          .from("treatments")
          .select("id")
          .eq("order_id", order.id)
          .order("session_number", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (tErr) throw tErr;
        if (!firstTr) throw new Error("Không tạo được buổi liệu trình từ dịch vụ mới.");
        finalTreatmentId = firstTr.id;
      } else {
        if (!treatmentId) throw new Error("Chọn buổi liệu trình.");
      }

      // Chặn xếp trùng cho cùng 1 buổi đang chạy
      const { data: dup } = await supabase
        .from("tours")
        .select("id")
        .eq("treatment_id", finalTreatmentId)
        .eq("status", "in_progress")
        .maybeSingle();
      if (dup) throw new Error("Buổi này đang có ca đang chạy.");

      const commission = Number(commissionAmount || 0);
      const now = new Date().toISOString();
      const { data: tour, error: tErr2 } = await supabase.from("tours").insert({
        treatment_id: finalTreatmentId,
        customer_id: customerId,
        technician_id: technicianId,
        notes: notes.trim() || null,
        commission_amount: commission,
        status: "in_progress",
        start_time: now,
        end_time: null,
      }).select().single();
      if (tErr2) throw tErr2;

      // Ghi log thông báo cho NV
      await supabase.from("notifications").insert({
        recipient_id: technicianId,
        type: "tour_started",
        title: "Bạn được xếp 1 ca làm mới",
        body: `${customerMap.get(customerId)?.name ?? "Khách"} · ${selectedService?.name ?? "Dịch vụ"}. Quét QR khách khi hoàn tất.`,
        ref_type: "tour",
        ref_id: tour.id,
      });
    },
    onSuccess: () => {
      toast.success("Đã bắt đầu ca — Nhân viên sẽ khả dụng lại sau khi quét QR kết thúc.");
      resetForm();
      qc.invalidateQueries({ queryKey: ["tours2"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summaryCust = customerId ? customerMap.get(customerId) : null;
  const summaryUser = technicianId ? userMap.get(technicianId) : null;

  return (
    <>
      <AdminTopbar
        title="Quản lý Ca làm (Tours)"
        subtitle="Chia buổi liệu trình cho nhân viên — tự động trừ buổi & ghi nhận hoa hồng."
      />

      <AssignDndProvider
        staff={availableStaff}
        onAssign={(staffId, targetId) => {
          if (targetId === "tour-staff-dropzone") setTechnicianId(staffId);
        }}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* ============ Cột trái: Form Ghi nhận ca làm ============ */}
          <section>
            <div className="bg-white border border-hairline rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-brand-soft text-brand-dark grid place-items-center font-black">
                  T
                </div>
                <div>
                  <h3 className="font-black text-lg">Ghi nhận ca làm</h3>
                  <p className="text-xs text-ink-muted">
                    Chọn khách → buổi liệu trình còn lại → nhân viên thực hiện.
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  complete.mutate();
                }}
                className="space-y-4"
              >
                <CustomerPicker
                  customers={customersQ.data ?? []}
                  value={customerId}
                  onChange={(v) => {
                    setCustomerId(v);
                    setTreatmentId("");
                    setNewServiceId("");
                    // Khách mới chưa có liệu trình → mặc định chuyển sang "Dịch vụ mới"
                    if (v && v !== "__new") {
                      const isNewlyCreated = !(customersQ.data ?? []).some((c) => c.id === v);
                      if (isNewlyCreated) setMode("new");
                    }
                  }}
                  onCreated={(c) => {
                    // Cập nhật cache ngay để Select hiển thị tên khách vừa tạo,
                    // đồng thời invalidate để đồng bộ với danh sách khách hàng.
                    qc.setQueryData<Customer[]>(["tours2", "customers"], (prev) => {
                      const list = prev ?? [];
                      if (list.some((x) => x.id === c.id)) return list;
                      return [{ id: c.id, name: c.name, phone: c.phone }, ...list];
                    });
                    qc.invalidateQueries({ queryKey: ["tours2", "customers"] });
                    // Đồng bộ danh sách khách hàng ở trang /admin/customers
                    qc.invalidateQueries({ queryKey: ["customers"] });
                  }}
                />


                {/* Mode toggle — chỉ hiện khi đã chọn khách sẵn có */}
                {customerId && customerId !== "__new" && (
                  <div className="space-y-1.5">
                    <Label>Loại buổi *</Label>
                    <div className="inline-flex rounded-xl border border-hairline bg-[#fafcf7] p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => { setMode("existing"); setNewServiceId(""); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          mode === "existing" ? "bg-brand-primary text-white shadow" : "text-ink-muted hover:text-brand-dark"
                        }`}
                      >
                        Liệu trình có sẵn
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMode("new"); setTreatmentId(""); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          mode === "new" ? "bg-brand-primary text-white shadow" : "text-ink-muted hover:text-brand-dark"
                        }`}
                      >
                        Dịch vụ mới
                      </button>
                    </div>
                  </div>
                )}

                {mode === "existing" ? (
                  <div className="space-y-1.5">
                    <Label>Buổi liệu trình còn lại *</Label>
                    <Select
                      value={treatmentId}
                      onValueChange={setTreatmentId}
                      disabled={!customerId || customerId === "__new"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !customerId || customerId === "__new"
                            ? "Chọn khách trước"
                            : treatmentsForCustomer.length === 0
                              ? "Khách chưa có liệu trình còn lại — chuyển sang Dịch vụ mới"
                              : "Chọn buổi"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentsForCustomer.map((t) => {
                          const svc = t.service_id ? serviceMap.get(t.service_id) : null;
                          return (
                            <SelectItem key={t.id} value={t.id}>
                              Buổi #{t.session_number} · {svc?.name ?? "—"} · còn {t.remaining} buổi
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Dịch vụ mới *</Label>
                    <Select value={newServiceId} onValueChange={setNewServiceId}>
                      <SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger>
                      <SelectContent>
                        {(servicesQ.data ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}{s.price ? ` · ${Number(s.price).toLocaleString("vi-VN")} ₫` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-ink-muted italic">
                      Tự động tạo đơn hàng & buổi #1 khi bấm Bắt đầu.
                    </p>
                  </div>
                )}


                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nhân viên thực hiện *</Label>
                    <Select value={technicianId} onValueChange={setTechnicianId}>
                      <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                      <SelectContent>
                        {availableStaff.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name} · {u.meta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <StaffDropZone
                      onDropStaff={(id) => setTechnicianId(id)}
                      currentName={summaryUser?.full_name ?? null}
                      onClear={() => setTechnicianId("")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Hoa hồng (₫){" "}
                      <span className="text-[11px] text-ink-muted font-normal">
                        (tự điền mặc định — có thể sửa)
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={commissionAmount}
                      onChange={(e) => {
                        setCommissionAmount(e.target.value);
                        setCommissionEdited(true);
                      }}
                      placeholder="VD: 50000"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Ghi chú</Label>
                  <Textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tình trạng, phản hồi, lưu ý buổi sau…"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm font-bold text-ink-muted hover:text-brand-dark"
                  >
                    Làm mới
                  </button>
                  <Button type="submit" disabled={complete.isPending}>
                    {complete.isPending ? "Đang xử lý…" : "▶ Bắt đầu Ca làm"}
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* ============ Cột phải: Tóm tắt + Nhân viên khả dụng ============ */}
          <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
            <div className="bg-white border border-hairline rounded-2xl p-4">
              <h4 className="font-black text-sm mb-3">Tóm tắt</h4>
              <dl className="text-xs space-y-2">
                <Row label="Khách">{summaryCust?.name ?? "—"}</Row>
                <Row label="Buổi">
                  {mode === "new"
                    ? (selectedService?.name ? `Mới · ${selectedService.name}` : "—")
                    : selectedTreatment
                      ? `#${selectedTreatment.session_number} · ${selectedService?.name ?? "—"}`
                      : "—"}
                </Row>
                <Row label="Nhân viên">{summaryUser?.full_name ?? "—"}</Row>
                <Row label="Hoa hồng">
                  {commissionAmount
                    ? Number(commissionAmount).toLocaleString("vi-VN") + " ₫"
                    : "—"}
                </Row>
              </dl>
              <p className="mt-3 text-[11px] text-ink-muted leading-relaxed">
                Bấm <b>Bắt đầu</b>: tạo Tour trạng thái <i>in_progress</i>, NV
                bị khoá khỏi danh sách khả dụng. Khi NV quét QR khách ở{" "}
                <i>/app/scan</i> → Tour đóng, hoa hồng ghi nhận, NV khả dụng lại.
              </p>
            </div>

            <div className="bg-white border border-hairline rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="font-black text-sm">
                  Nhân viên khả dụng{" "}
                  <span className="text-ink-muted font-semibold">
                    ({filteredStaff.length})
                  </span>
                </h4>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
                <Input
                  value={staffQ}
                  onChange={(e) => setStaffQ(e.target.value)}
                  placeholder="Tìm nhân viên…"
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {filteredStaff.length === 0 ? (
                <div className="text-[11px] text-ink-muted italic text-center py-4">
                  Không có nhân viên phù hợp.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                  {filteredStaff.map((s) => (
                    <DraggableStaff key={s.id} s={s} compact />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </AssignDndProvider>

      <ToursHistory />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-bold text-brand-dark text-right truncate max-w-[180px]">{children}</dd>
    </div>
  );
}

function ToursHistory() {
  const toursQ = useQuery({
    queryKey: ["tours2", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as TourRow[];
    },
  });
  const usersQ = useQuery({
    queryKey: ["tours2", "users-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name");
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string | null }[];
    },
  });
  const customersQ = useQuery({
    queryKey: ["tours2", "customers-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string | null }[];
    },
  });

  const uname = (id: string) => (usersQ.data ?? []).find((u) => u.id === id)?.full_name ?? "—";
  const cname = (id: string) => (customersQ.data ?? []).find((c) => c.id === id)?.name ?? "—";

  return (
    <section className="mt-8">
      <h3 className="font-black text-lg mb-3">Danh sách ca làm gần nhất</h3>
      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              {["Thời gian", "Khách hàng", "Nhân viên", "Hoa hồng", "Trạng thái"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(toursQ.data ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{new Date(t.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{cname(t.customer_id)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{uname(t.technician_id)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">
                  {t.commission_amount ? Number(t.commission_amount).toLocaleString("vi-VN") + " ₫" : "—"}
                </td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                    t.status === "in_progress" ? "bg-amber-100 text-amber-800" :
                    t.status === "cancelled" ? "bg-rose-100 text-rose-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>{t.status}</span>
                </td>
              </tr>
            ))}
            {(toursQ.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-3.5 py-10 text-center text-ink-muted">Chưa có ca làm nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
