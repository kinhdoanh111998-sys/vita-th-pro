import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

type Option = { id: string; label: string; sub?: string };

function OrdersPage() {
  const [customers, setCustomers] = useState<Option[]>([]);
  const [staffs, setStaffs] = useState<Option[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [packageName, setPackageName] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([
        supabase.from("customers").select("id,name,phone"),
        supabase.from("employees").select("id,name,role"),
      ]);
      if (c.error || s.error) {
        setLoadError(c.error?.message || s.error?.message || null);
      }
      setCustomers(
        (c.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          label: String(r.name ?? "—"),
          sub: r.phone ? String(r.phone) : undefined,
        })),
      );
      setStaffs(
        (s.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          label: String(r.name ?? "—"),
          sub: r.role ? String(r.role) : undefined,
        })),
      );
    })();
  }, []);

  const suggestedCommission = useMemo(() => {
    const n = Number(totalPrice || 0);
    return n > 0 ? Math.round(n * 0.05) : 0;
  }, [totalPrice]);

  // ====== HÀM LOGIC CHUẨN – KHÔNG ĐƯỢC THAY ĐỔI ======
  const handleCreateOrder = async (
    customerId: string,
    staffId: string,
    packageName: string,
    totalSessions: number,
    totalPrice: number,
    commissionAmount: number,
  ) => {
    try {
      // Bước 1: Ghi nhận Đơn hàng (Orders)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: customerId,
            staff_id: staffId,
            package_name: packageName,
            total_sessions: totalSessions,
            total_price: totalPrice,
            status: "completed",
          },
        ])
        .select()
        .single();
      if (orderError) throw orderError;

      // Bước 2: Tự động khởi tạo Liệu trình (Treatments) cho khách
      const { error: treatmentError } = await supabase.from("treatments").insert([
        {
          customer_id: customerId,
          package_name: packageName,
          total_sessions: totalSessions,
          remaining_sessions: totalSessions,
          used_sessions: 0,
          status: "active",
        },
      ]);
      if (treatmentError) throw treatmentError;

      // Bước 3: Ghi nhận Hoa hồng (Commissions) loại 'sale_order' cho nhân viên sale
      const { error: commissionError } = await supabase.from("commissions").insert([
        {
          staff_id: staffId,
          commission_type: "sale_order",
          reference_id: orderData.id,
          amount: commissionAmount,
          status: "pending",
        },
      ]);
      if (commissionError) throw commissionError;

      alert("Tạo đơn hàng thành công! Đã cập nhật liệu trình cho khách và ghi nhận hoa hồng.");
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };
  // ====== HẾT HÀM LOGIC CHUẨN ======

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !staffId || !packageName || !totalSessions || !totalPrice) {
      alert("Vui lòng nhập đủ thông tin đơn hàng.");
      return;
    }
    setSubmitting(true);
    await handleCreateOrder(
      customerId,
      staffId,
      packageName,
      Number(totalSessions),
      Number(totalPrice),
      Number(commissionAmount || 0),
    );
    setSubmitting(false);
    setPackageName("");
    setTotalSessions("");
    setTotalPrice("");
    setCommissionAmount("");
  };

  return (
    <>
      <AdminTopbar
        title="Quản lý Đơn hàng (Orders)"
        subtitle="Tạo đơn bán gói – tự động khởi tạo liệu trình và tính hoa hồng cho sale."
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
              ₫
            </div>
            <div>
              <h2 className="font-black text-lg">Tạo đơn hàng mới</h2>
              <p className="text-xs text-ink-muted">
                Bán gói dịch vụ cho khách – hệ thống tự tạo liệu trình tương ứng.
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
              <Label>Nhân viên sale *</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {staffs.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                      {o.sub ? ` · ${o.sub}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tên gói dịch vụ *</Label>
              <Input
                placeholder="VD: Gói chăm sóc da cơ bản 10 buổi"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Số buổi *</Label>
              <Input
                type="number"
                min={1}
                placeholder="VD: 10"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tổng tiền (VND) *</Label>
              <Input
                type="number"
                min={0}
                placeholder="VD: 5000000"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Hoa hồng sale (VND){" "}
                {suggestedCommission > 0 && (
                  <button
                    type="button"
                    onClick={() => setCommissionAmount(String(suggestedCommission))}
                    className="ml-2 text-xs font-bold text-brand-dark underline"
                  >
                    Gợi ý 5%: {suggestedCommission.toLocaleString("vi-VN")} ₫
                  </button>
                )}
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="VD: 250000"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCustomerId("");
                setStaffId("");
                setPackageName("");
                setTotalSessions("");
                setTotalPrice("");
                setCommissionAmount("");
              }}
            >
              Làm mới
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang xử lý..." : "✓ Tạo Đơn hàng"}
            </Button>
          </div>
        </form>

        <aside className="bg-gradient-to-br from-brand-soft to-white border border-hairline rounded-2xl p-6 space-y-4 h-fit">
          <h3 className="font-black text-base">Tóm tắt đơn hàng</h3>
          <Row label="Khách hàng" value={customers.find((x) => x.id === customerId)?.label} />
          <Row label="Sale phụ trách" value={staffs.find((x) => x.id === staffId)?.label} />
          <Row label="Gói" value={packageName} />
          <Row
            label="Số buổi"
            value={totalSessions ? `${totalSessions} buổi` : undefined}
          />
          <Row
            label="Tổng tiền"
            value={
              totalPrice ? Number(totalPrice).toLocaleString("vi-VN") + " ₫" : undefined
            }
          />
          <Row
            label="Hoa hồng"
            value={
              commissionAmount
                ? Number(commissionAmount).toLocaleString("vi-VN") + " ₫"
                : undefined
            }
          />
          <div className="pt-3 mt-3 border-t border-hairline text-xs text-ink-muted leading-relaxed">
            Khi bấm <b className="text-brand-dark">Tạo Đơn hàng</b>: ghi nhận order, khởi tạo
            liệu trình <i>active</i> cho khách và cộng hoa hồng <i>pending</i> cho sale.
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
      <span className="font-bold text-right break-words max-w-[60%]">{value || "—"}</span>
    </div>
  );
}
