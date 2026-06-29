import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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

type Customer = { id: string; name: string; phone?: string | null };
type Staff = { id: string; full_name: string; role?: string | null };
type CatalogItem = {
  id: string;
  name: string;
  price: number | null;
  type: string | null;
};
type OrderRow = {
  id: string;
  created_at: string;
  customer_id: string | null;
  staff_id: string | null;
  catalog_id?: string | null;
  package_name: string | null;
  total_sessions: number | null;
  total_price: number | null;
  status: string | null;
};

const TREATMENT_TYPES = new Set(["dịch vụ", "liệu trình", "dich vu", "lieu trinh"]);
const isTreatmentType = (t?: string | null) =>
  !!t && TREATMENT_TYPES.has(t.trim().toLowerCase());

function OrdersPage() {
  const qc = useQueryClient();

  const customersQ = useQuery({
    queryKey: ["customers", "list"],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name,phone")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const staffsQ = useQuery({
    queryKey: ["users", "list"],
    queryFn: async (): Promise<Staff[]> => {
      const { data, error } = await supabase.from("users").select("id,full_name,role");
      if (error) throw error;
      return (data ?? []) as Staff[];
    },
  });

  const catalogQ = useQuery({
    queryKey: ["catalog", "list"],
    queryFn: async (): Promise<CatalogItem[]> => {
      const { data, error } = await supabase
        .from("catalog")
        .select("id,name,price,type");
      if (error) throw error;
      return (data ?? []) as CatalogItem[];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["orders", "list"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");

  const selectedCatalog = useMemo(
    () => catalogQ.data?.find((c) => c.id === catalogId),
    [catalogQ.data, catalogId],
  );

  const onSelectCatalog = (id: string) => {
    setCatalogId(id);
    const item = catalogQ.data?.find((c) => c.id === id);
    if (item && item.price != null) setTotalPrice(String(item.price));
  };

  const suggestedCommission = useMemo(() => {
    const n = Number(totalPrice || 0);
    return n > 0 ? Math.round(n * 0.05) : 0;
  }, [totalPrice]);

  const resetForm = () => {
    setCustomerId("");
    setStaffId("");
    setCatalogId("");
    setTotalSessions("");
    setTotalPrice("");
    setCommissionAmount("");
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!selectedCatalog) throw new Error("Vui lòng chọn sản phẩm/dịch vụ.");
      const packageName = selectedCatalog.name;
      const sessions = Number(totalSessions) || 0;
      const price = Number(totalPrice) || 0;
      const commission = Number(commissionAmount) || 0;

      // 1) Insert order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: customerId,
            staff_id: staffId,
            package_name: packageName,
            total_sessions: sessions,
            total_price: price,
            status: "completed",
          },
        ])
        .select()
        .single();
      if (orderError) throw orderError;

      // 2) If service/treatment type → auto create treatment
      if (isTreatmentType(selectedCatalog.type) && sessions > 0) {
        const { error: tErr } = await supabase.from("treatments").insert([
          {
            customer_id: customerId,
            package_name: packageName,
            total_sessions: sessions,
            used_sessions: 0,
            remaining_sessions: sessions,
            status: "active",
          },
        ]);
        if (tErr) throw tErr;
      }

      // 3) Commission (if > 0)
      if (commission > 0) {
        const { error: cErr } = await supabase.from("commissions").insert([
          {
            staff_id: staffId,
            commission_type: "sale_order",
            reference_id: orderData.id,
            amount: commission,
            status: "pending",
          },
        ]);
        if (cErr) throw cErr;
      }
    },
    onSuccess: () => {
      toast.success("Tạo đơn hàng thành công!", {
        description: isTreatmentType(selectedCatalog?.type)
          ? "Đã tự động khởi tạo liệu trình cho khách."
          : undefined,
      });
      resetForm();
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["treatments"] });
      qc.invalidateQueries({ queryKey: ["commissions"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại!";
      toast.error("Lỗi tạo đơn hàng", { description: msg });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customerId || !staffId || !catalogId || !totalSessions || !totalPrice) {
      toast.error("Vui lòng nhập đủ thông tin đơn hàng.");
      return;
    }
    createOrder.mutate();
  };

  // ===== Table filters =====
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const customerMap = useMemo(() => {
    const m = new Map<string, string>();
    customersQ.data?.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [customersQ.data]);
  const staffMap = useMemo(() => {
    const m = new Map<string, string>();
    staffsQ.data?.forEach((s) => m.set(s.id, s.full_name));
    return m;
  }, [staffsQ.data]);

  const filteredOrders = useMemo(() => {
    const list = ordersQ.data ?? [];
    return list.filter((o) => {
      if (!o.created_at) return true;
      const d = new Date(o.created_at).getTime();
      if (fromDate && d < new Date(fromDate + "T00:00:00").getTime()) return false;
      if (toDate && d > new Date(toDate + "T23:59:59").getTime()) return false;
      return true;
    });
  }, [ordersQ.data, fromDate, toDate]);

  const isService = isTreatmentType(selectedCatalog?.type);

  return (
    <>
      <AdminTopbar
        title="Quản lý Đơn hàng (Orders)"
        subtitle="Tạo đơn bán gói – tự động khởi tạo liệu trình và tính hoa hồng cho sale."
      />

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
                  {customersQ.data?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                      {o.phone ? ` · ${o.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nhân viên chốt đơn *</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {staffsQ.data?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.full_name}
                      {o.role ? ` · ${o.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Sản phẩm / Dịch vụ *{" "}
                {selectedCatalog && (
                  <span className="ml-2 text-xs font-bold text-brand-dark">
                    [{selectedCatalog.type}]
                    {isService ? " → tự tạo liệu trình" : ""}
                  </span>
                )}
              </Label>
              <Select value={catalogId} onValueChange={onSelectCatalog}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sản phẩm / dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {catalogQ.data?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                      {o.price != null
                        ? ` · ${Number(o.price).toLocaleString("vi-VN")} ₫`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="button" variant="ghost" onClick={resetForm}>
              Làm mới
            </Button>
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending ? "Đang xử lý..." : "✓ Tạo Đơn hàng"}
            </Button>
          </div>
        </form>

        <aside className="bg-gradient-to-br from-brand-soft to-white border border-hairline rounded-2xl p-6 space-y-4 h-fit">
          <h3 className="font-black text-base">Tóm tắt đơn hàng</h3>
          <Row label="Khách hàng" value={customerMap.get(customerId)} />
          <Row label="Sale phụ trách" value={staffMap.get(staffId)} />
          <Row label="Gói" value={selectedCatalog?.name} />
          <Row
            label="Loại"
            value={selectedCatalog?.type ?? undefined}
          />
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
            {isService ? (
              <>
                Sản phẩm là <b className="text-brand-dark">{selectedCatalog?.type}</b> →
                hệ thống sẽ tự khởi tạo liệu trình <i>active</i> cho khách.
              </>
            ) : (
              <>Khi bấm <b className="text-brand-dark">Tạo Đơn hàng</b>: ghi nhận order & hoa hồng.</>
            )}
          </div>
        </aside>
      </div>

      {/* ============ DANH SÁCH ĐƠN HÀNG ============ */}
      <section className="mt-8 bg-white border border-hairline rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 border-b border-hairline">
          <div>
            <h3 className="font-black text-lg">Danh sách Đơn hàng</h3>
            <p className="text-xs text-ink-muted">
              {filteredOrders.length} đơn{fromDate || toDate ? " (đã lọc)" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-[160px]"
              />
            </div>
            {(fromDate || toDate) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Xoá lọc
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-soft/40 text-left">
              <tr className="text-ink-muted">
                <th className="px-4 py-3 font-bold">Ngày tạo</th>
                <th className="px-4 py-3 font-bold">Khách hàng</th>
                <th className="px-4 py-3 font-bold">Sản phẩm / Gói</th>
                <th className="px-4 py-3 font-bold">Số buổi</th>
                <th className="px-4 py-3 font-bold">Tổng tiền</th>
                <th className="px-4 py-3 font-bold">Sale</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {ordersQ.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="border-t border-hairline hover:bg-brand-soft/20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {(o.customer_id && customerMap.get(o.customer_id)) || "—"}
                    </td>
                    <td className="px-4 py-3">{o.package_name || "—"}</td>
                    <td className="px-4 py-3">{o.total_sessions ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-brand-dark">
                      {o.total_price != null
                        ? Number(o.total_price).toLocaleString("vi-VN") + " ₫"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {(o.staff_id && staffMap.get(o.staff_id)) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand-dark">
                        {o.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
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
