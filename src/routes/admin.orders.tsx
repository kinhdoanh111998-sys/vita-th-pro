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
type Service = {
  id: string;
  name: string;
  price: number | null;
  default_sessions: number | null;
};
type OrderRow = {
  id: string;
  created_at: string;
  customer_id: string;
  service_id: string;
  quantity: number;
  total_amount: number;
  status: string | null;
};

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

  const servicesQ = useQuery({
    queryKey: ["services", "list"],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,price,default_sessions")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Service[];
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
  const [serviceId, setServiceId] = useState("");
  const [quantity, setQuantity] = useState("");

  const selectedService = useMemo(
    () => servicesQ.data?.find((s) => s.id === serviceId),
    [servicesQ.data, serviceId],
  );

  const onSelectService = (id: string) => {
    setServiceId(id);
    const item = servicesQ.data?.find((s) => s.id === id);
    if (item?.default_sessions && !quantity) {
      setQuantity(String(item.default_sessions));
    }
  };

  const totalAmount = useMemo(() => {
    const q = Number(quantity) || 0;
    const p = Number(selectedService?.price ?? 0);
    return q * p;
  }, [quantity, selectedService]);

  const resetForm = () => {
    setCustomerId("");
    setServiceId("");
    setQuantity("");
  };

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error("Vui lòng chọn khách hàng.");
      if (!selectedService) throw new Error("Vui lòng chọn dịch vụ.");
      const q = Number(quantity) || 0;
      if (q <= 0) throw new Error("Số buổi phải lớn hơn 0.");

      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: customerId,
            service_id: selectedService.id,
            quantity: q,
            total_amount: totalAmount,
            status: "paid",
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Tạo đơn hàng thành công!", {
        description: `Đã tự động sinh ${quantity} buổi liệu trình kèm mã QR.`,
      });
      resetForm();
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["treatments"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Có lỗi xảy ra, vui lòng thử lại!";
      toast.error("Lỗi tạo đơn hàng", { description: msg });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  const serviceMap = useMemo(() => {
    const m = new Map<string, string>();
    servicesQ.data?.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [servicesQ.data]);

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

  return (
    <>
      <AdminTopbar
        title="Quản lý Đơn hàng (Orders)"
        subtitle="Tạo đơn – hệ thống tự sinh các buổi liệu trình kèm mã QR độc nhất."
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
                Chọn khách hàng, dịch vụ và số buổi – hệ thống lo phần còn lại.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Khách hàng *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customersQ.data?.length === 0 && (
                    <div className="px-3 py-2 text-sm text-ink-muted">
                      Chưa có khách hàng nào.
                    </div>
                  )}
                  {customersQ.data?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                      {o.phone ? ` · ${o.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                Dịch vụ / Gói *
                {selectedService?.price != null && (
                  <span className="ml-2 text-xs font-bold text-brand-dark">
                    · Đơn giá {Number(selectedService.price).toLocaleString("vi-VN")} ₫
                  </span>
                )}
              </Label>
              <Select value={serviceId} onValueChange={onSelectService}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {servicesQ.data?.length === 0 && (
                    <div className="px-3 py-2 text-sm text-ink-muted">
                      Chưa có dịch vụ nào.
                    </div>
                  )}
                  {servicesQ.data?.map((o) => (
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
              <Label>Số buổi (quantity) *</Label>
              <Input
                type="number"
                min={1}
                placeholder="VD: 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tổng tiền (tự tính)</Label>
              <Input
                readOnly
                value={totalAmount ? totalAmount.toLocaleString("vi-VN") + " ₫" : ""}
                placeholder="—"
                className="bg-brand-soft/30 font-bold text-brand-dark"
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
          <Row label="Dịch vụ" value={selectedService?.name} />
          <Row
            label="Đơn giá"
            value={
              selectedService?.price != null
                ? Number(selectedService.price).toLocaleString("vi-VN") + " ₫"
                : undefined
            }
          />
          <Row label="Số buổi" value={quantity ? `${quantity} buổi` : undefined} />
          <Row
            label="Tổng tiền"
            value={totalAmount ? totalAmount.toLocaleString("vi-VN") + " ₫" : undefined}
          />
          <div className="pt-3 mt-3 border-t border-hairline text-xs text-ink-muted leading-relaxed">
            Khi bấm <b className="text-brand-dark">Tạo Đơn hàng</b>, trigger DB sẽ
            tự động sinh <b>{quantity || "N"}</b> buổi liệu trình, mỗi buổi có{" "}
            <b>mã QR duy nhất</b>.
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
                <th className="px-4 py-3 font-bold">Dịch vụ</th>
                <th className="px-4 py-3 font-bold">Số buổi</th>
                <th className="px-4 py-3 font-bold">Tổng tiền</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {ordersQ.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
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
                      {customerMap.get(o.customer_id) || "—"}
                    </td>
                    <td className="px-4 py-3">{serviceMap.get(o.service_id) || "—"}</td>
                    <td className="px-4 py-3">{o.quantity ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-brand-dark">
                      {o.total_amount != null
                        ? Number(o.total_amount).toLocaleString("vi-VN") + " ₫"
                        : "—"}
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
