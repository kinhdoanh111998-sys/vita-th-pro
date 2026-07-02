import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  Plus, Trash2, Search, User, Ticket, X, Minus, ShoppingCart, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

type Customer = { id: string; name: string; phone: string | null };
type CatalogItem = {
  id: string; name: string; price: number;
  default_sessions: number | null; type: "product" | "service";
};
type StaffUser = { id: string; full_name: string | null; email: string; role: string };
type OrderRow = {
  id: string; created_at: string; order_code: string | null;
  customer_id: string; status: string; total_amount: number;
  subtotal_amount: number; discount_amount: number;
  sales_staff_id: string | null; commission_rate: number;
  voucher_id: string | null;
};
type Voucher = {
  id: string; code: string; discount_type: "percent" | "amount";
  discount_value: number; valid_from: string | null; valid_to: string | null;
  is_active: boolean;
};

type ItemLine = {
  item_type: "product" | "service";
  item_id: string;
  quantity: number;
};
type FormValues = {
  customer_id: string;
  new_customer_name: string;
  new_customer_phone: string;
  items: ItemLine[];
  voucher_code: string;
  sales_staff_id: string;
  commission_rate: number;
};

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }

function OrdersPage() {
  const qc = useQueryClient();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const customersQ = useQuery({
    queryKey: ["customers", "list"],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase.from("customers")
        .select("id,name,phone").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const catalogQ = useQuery({
    queryKey: ["services", "catalog-all"],
    queryFn: async (): Promise<CatalogItem[]> => {
      const { data, error } = await supabase.from("services")
        .select("id,name,price,default_sessions,type").order("name");
      if (error) throw error;
      return (data ?? []) as CatalogItem[];
    },
  });

  const staffQ = useQuery({
    queryKey: ["users", "staff"],
    queryFn: async (): Promise<StaffUser[]> => {
      const { data, error } = await supabase.from("users")
        .select("id,full_name,email,role")
        .in("role", ["admin", "manager", "sales", "technician", "staff"]);
      if (error) throw error;
      return (data ?? []) as StaffUser[];
    },
  });

  const ordersQ = useQuery({
    queryKey: ["orders", "list"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase.from("orders")
        .select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const customerMap = useMemo(() => {
    const m = new Map<string, Customer>();
    customersQ.data?.forEach((c) => m.set(c.id, c));
    return m;
  }, [customersQ.data]);
  const staffMap = useMemo(() => {
    const m = new Map<string, StaffUser>();
    staffQ.data?.forEach((s) => m.set(s.id, s));
    return m;
  }, [staffQ.data]);

  const filteredOrders = useMemo(() => {
    return (ordersQ.data ?? []).filter((o) => {
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
        title="Quản lý Đơn hàng"
        subtitle="Tạo đơn hàng đa mặt hàng · Áp voucher · Ghi nhận người bán & hoa hồng."
      />

      <section className="bg-white border border-hairline rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 border-b border-hairline">
          <div>
            <h3 className="font-black text-lg">Danh sách Đơn hàng</h3>
            <p className="text-xs text-ink-muted">{filteredOrders.length} đơn{fromDate || toDate ? " (đã lọc)" : ""}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[150px]" />
            </div>
            {(fromDate || toDate) && (
              <Button type="button" variant="ghost" onClick={() => { setFromDate(""); setToDate(""); }}>
                Xoá lọc
              </Button>
            )}
            <Button onClick={() => setOpenDrawer(true)}>
              <Plus className="size-4 mr-1.5 inline" /> Tạo đơn hàng mới
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-soft/40 text-left">
              <tr className="text-ink-muted">
                <th className="px-4 py-3 font-bold">Mã đơn</th>
                <th className="px-4 py-3 font-bold">Ngày</th>
                <th className="px-4 py-3 font-bold">Khách hàng</th>
                <th className="px-4 py-3 font-bold">Người bán</th>
                <th className="px-4 py-3 font-bold text-right">Tạm tính</th>
                <th className="px-4 py-3 font-bold text-right">Giảm</th>
                <th className="px-4 py-3 font-bold text-right">Tổng</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {ordersQ.isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  <ShoppingCart className="mx-auto size-8 mb-2 opacity-50" />
                  Chưa có đơn hàng nào.
                </td></tr>
              ) : filteredOrders.map((o) => {
                const c = customerMap.get(o.customer_id);
                const s = o.sales_staff_id ? staffMap.get(o.sales_staff_id) : null;
                return (
                  <tr key={o.id} className="border-t border-hairline hover:bg-brand-soft/20">
                    <td className="px-4 py-3">
                      <Badge className="bg-brand-dark text-white font-mono">{o.order_code ?? o.id.slice(0, 8)}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {new Date(o.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{c?.name ?? "—"}</div>
                      <div className="text-xs text-ink-muted">{c?.phone ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {s ? <>{s.full_name ?? s.email}<div className="text-ink-muted">{o.commission_rate}%</div></> : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(Number(o.subtotal_amount ?? 0))}</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {Number(o.discount_amount) > 0 ? "-" + fmt(Number(o.discount_amount)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-dark">{fmt(Number(o.total_amount))}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand-dark">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <CreateOrderDrawer
        open={openDrawer}
        onOpenChange={setOpenDrawer}
        customers={customersQ.data ?? []}
        catalog={catalogQ.data ?? []}
        staff={staffQ.data ?? []}
        onCreated={() => {
          setOpenDrawer(false);
          qc.invalidateQueries({ queryKey: ["orders"] });
          qc.invalidateQueries({ queryKey: ["customers"] });
          qc.invalidateQueries({ queryKey: ["treatments"] });
        }}
      />
    </>
  );
}

/* ============================================================ */
function CreateOrderDrawer({
  open, onOpenChange, customers, catalog, staff, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: Customer[];
  catalog: CatalogItem[];
  staff: StaffUser[];
  onCreated: () => void;
}) {
  const form = useForm<FormValues>({
    defaultValues: {
      customer_id: "",
      new_customer_name: "",
      new_customer_phone: "",
      items: [],
      voucher_code: "",
      sales_staff_id: "",
      commission_rate: 5,
    },
  });
  const { register, handleSubmit, control, watch, setValue, reset, formState: { isSubmitting } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [customerSearch, setCustomerSearch] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  useEffect(() => {
    if (!open) {
      reset();
      setCustomerSearch("");
      setAppliedVoucher(null);
    }
  }, [open, reset]);

  const items = watch("items");
  const customerId = watch("customer_id");
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const customerResults = useMemo(() => {
    const s = customerSearch.trim().toLowerCase();
    if (!s) return [];
    return customers.filter((c) =>
      c.name.toLowerCase().includes(s) || (c.phone ?? "").includes(s)
    ).slice(0, 6);
  }, [customers, customerSearch]);

  // NOTE: Không dùng useMemo vì react-hook-form `watch` trả về reference ổn định,
  // deps sẽ không đổi khi user chỉnh quantity → memo không tính lại (bug tổng = 0).
  const subtotal = (items ?? []).reduce((sum, it) => {
    const cat = catalog.find((c) => c.id === it?.item_id);
    const price = cat?.price ?? 0;
    return sum + price * (Number(it?.quantity) || 0);
  }, 0);

  const discountAmount = (() => {
    if (!appliedVoucher) return 0;
    const val = Number(appliedVoucher.discount_value);
    const raw = appliedVoucher.discount_type === "percent"
      ? Math.round((subtotal * val) / 100)
      : val;
    return Math.min(raw, subtotal);
  })();

  const total = Math.max(0, subtotal - discountAmount);


  const applyVoucher = async () => {
    const code = (watch("voucher_code") || "").trim().toUpperCase();
    if (!code) { toast.error("Vui lòng nhập mã voucher"); return; }
    setCheckingVoucher(true);
    try {
      const { data: v, error } = await supabase.from("vouchers")
        .select("*").eq("code", code).maybeSingle();
      if (error) throw error;
      if (!v) { toast.error("Mã voucher không tồn tại"); setAppliedVoucher(null); return; }
      if (!v.is_active) { toast.error("Voucher đã tạm dừng"); setAppliedVoucher(null); return; }
      const now = Date.now();
      if (v.valid_from && new Date(v.valid_from).getTime() > now) { toast.error("Voucher chưa đến ngày áp dụng"); setAppliedVoucher(null); return; }
      if (v.valid_to && new Date(v.valid_to).getTime() < now) { toast.error("Voucher đã hết hạn"); setAppliedVoucher(null); return; }

      // Check item conditions
      const { data: conds } = await supabase.from("voucher_conditions")
        .select("item_id").eq("voucher_id", v.id);
      if (conds && conds.length > 0) {
        const allowedIds = new Set(conds.map((c) => c.item_id as string));
        const hasAllowed = items.some((it) => allowedIds.has(it.item_id));
        if (!hasAllowed) {
          toast.error("Đơn hàng chưa chứa SP/DV được áp dụng voucher này");
          setAppliedVoucher(null); return;
        }
      }
      // Check customer scope
      const { data: cusScope } = await supabase.from("voucher_customers")
        .select("customer_id").eq("voucher_id", v.id);
      if (cusScope && cusScope.length > 0) {
        if (!customerId || !cusScope.some((x) => x.customer_id === customerId)) {
          toast.error("Voucher chỉ dành cho khách hàng cụ thể — hãy chọn đúng khách hàng");
          setAppliedVoucher(null); return;
        }
      }
      setAppliedVoucher(v as Voucher);
      toast.success(`Đã áp mã ${v.code}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kiểm tra voucher");
    } finally {
      setCheckingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setValue("voucher_code", "");
  };

  const onSubmit = async (values: FormValues) => {
    if (values.items.length === 0) { toast.error("Vui lòng thêm ít nhất 1 mặt hàng"); return; }
    for (const it of values.items) {
      if (!it.item_id) { toast.error("Có dòng chưa chọn mặt hàng"); return; }
      if (!it.quantity || it.quantity <= 0) { toast.error("Số lượng phải > 0"); return; }
    }

    try {
      // 1) Resolve customer
      let finalCustomerId = values.customer_id;
      if (!finalCustomerId) {
        const name = values.new_customer_name.trim();
        const phone = values.new_customer_phone.trim();
        if (!name) { toast.error("Nhập tên khách hàng mới hoặc chọn khách sẵn có"); return; }
        const { data: newCus, error: cErr } = await supabase.from("customers")
          .insert({ name, phone: phone || null }).select("id").single();
        if (cErr) throw cErr;
        finalCustomerId = newCus.id as string;
      }

      // 2) Insert order với status='pending' để tránh AFTER INSERT trigger fire khi chưa có order_items
      const { data: order, error: oErr } = await supabase.from("orders").insert({
        customer_id: finalCustomerId,
        subtotal_amount: subtotal,
        discount_amount: discountAmount,
        total_amount: total,
        voucher_id: appliedVoucher?.id ?? null,
        sales_staff_id: values.sales_staff_id || null,
        commission_rate: Number(values.commission_rate) || 5,
        status: "pending",
      }).select("id,order_code").single();
      if (oErr) throw oErr;

      // 3) Insert order_items
      const rows = values.items.map((it) => {
        const cat = catalog.find((c) => c.id === it.item_id)!;
        const unit = Number(cat.price);
        return {
          order_id: order.id as string,
          item_type: it.item_type,
          item_id: it.item_id,
          quantity: it.quantity,
          unit_price: unit,
          total_price: unit * it.quantity,
        };
      });
      const { error: iErr } = await supabase.from("order_items").insert(rows);
      if (iErr) throw iErr;

      // 4) Chuyển status → paid để UPDATE trigger sinh treatments cho các dòng service
      const { error: uErr } = await supabase.from("orders")
        .update({ status: "paid" }).eq("id", order.id);
      if (uErr) throw uErr;

      // 5) Increment voucher usage (best-effort; not race-safe)
      if (appliedVoucher) {
        await supabase.from("vouchers").update({
          used_count: (Number((appliedVoucher as unknown as { used_count?: number }).used_count) || 0) + 1,
        }).eq("id", appliedVoucher.id);
      }



      toast.success(`Đã tạo đơn ${order.order_code ?? ""}`, {
        description: `Tổng ${fmt(total)}. Liệu trình sẽ được tự sinh cho các dịch vụ.`,
      });
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo đơn hàng");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-brand" /> Tạo đơn hàng mới
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
          {/* Customer */}
          <section className="rounded-xl border border-hairline p-4 space-y-3">
            <div className="font-bold text-brand-dark flex items-center gap-2"><User className="size-4" /> Khách hàng</div>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg bg-brand-soft/40 px-3 py-2">
                <div>
                  <div className="font-bold">{selectedCustomer.name}</div>
                  <div className="text-xs text-ink-muted">{selectedCustomer.phone ?? "—"}</div>
                </div>
                <button type="button" onClick={() => setValue("customer_id", "")}
                  className="p-1.5 hover:bg-white rounded-md"><X className="size-4" /></button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
                  <Input placeholder="Tìm khách sẵn có theo tên/SĐT..." value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9" />
                </div>
                {customerResults.length > 0 && (
                  <div className="rounded-lg border border-hairline divide-y">
                    {customerResults.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setValue("customer_id", c.id); setCustomerSearch(""); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand-soft flex items-center justify-between">
                        <span>{c.name}</span>
                        <span className="text-xs text-ink-muted">{c.phone ?? ""}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-xs text-ink-muted">Hoặc nhập khách mới (sẽ tự tạo hồ sơ):</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Họ và tên" {...register("new_customer_name")} />
                  <Input placeholder="Số điện thoại" {...register("new_customer_phone")} />
                </div>
              </>
            )}
          </section>

          {/* Items */}
          <section className="rounded-xl border border-hairline p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-brand-dark">Mặt hàng ({fields.length})</div>
              <Button type="button" variant="secondary" size="sm"
                onClick={() => append({ item_type: "service", item_id: "", quantity: 1 })}>
                <Plus className="size-4 mr-1" /> Thêm dòng
              </Button>
            </div>
            {fields.length === 0 && (
              <div className="text-sm text-ink-muted text-center py-6 border border-dashed border-hairline rounded-lg">
                Chưa có mặt hàng. Bấm "Thêm dòng" để bắt đầu.
              </div>
            )}
            {fields.map((f, idx) => {
              const line = items[idx];
              const cat = catalog.find((c) => c.id === line?.item_id);
              const rowTotal = (cat?.price ?? 0) * (Number(line?.quantity) || 0);
              const filteredCatalog = catalog.filter((c) => c.type === line?.item_type);
              return (
                <div key={f.id} className="rounded-lg border border-hairline p-3 space-y-2 bg-brand-soft/10">
                  <div className="grid grid-cols-[110px_1fr_auto] gap-2 items-end">
                    <div>
                      <Label className="text-xs">Loại</Label>
                      <Controller control={control} name={`items.${idx}.item_type`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={(v) => {
                            field.onChange(v);
                            setValue(`items.${idx}.item_id`, "");
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="service">Dịch vụ</SelectItem>
                              <SelectItem value="product">Sản phẩm</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                    </div>
                    <div>
                      <Label className="text-xs">Chọn mặt hàng</Label>
                      <Controller control={control} name={`items.${idx}.item_id`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                            <SelectContent>
                              {filteredCatalog.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-ink-muted">Không có mục</div>
                              ) : filteredCatalog.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name} · {fmt(c.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )} />
                    </div>
                    <button type="button" onClick={() => remove(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md h-10">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs mr-2">Số lượng</Label>
                      <button type="button"
                        onClick={() => setValue(`items.${idx}.quantity`, Math.max(1, (Number(line?.quantity) || 1) - 1))}
                        className="p-1.5 border border-hairline rounded-md hover:bg-white"><Minus className="size-3.5" /></button>
                      <Input type="number" min={1} className="w-16 text-center"
                        {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                      <button type="button"
                        onClick={() => setValue(`items.${idx}.quantity`, (Number(line?.quantity) || 1) + 1)}
                        className="p-1.5 border border-hairline rounded-md hover:bg-white"><Plus className="size-3.5" /></button>
                    </div>
                    <div className="text-sm font-bold text-brand-dark">
                      = {fmt(rowTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Voucher */}
          <section className="rounded-xl border border-hairline p-4 space-y-3">
            <div className="font-bold text-brand-dark flex items-center gap-2"><Ticket className="size-4" /> Voucher</div>
            {appliedVoucher ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand text-white font-mono">{appliedVoucher.code}</Badge>
                    <Check className="size-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-ink-muted mt-1">
                    Giảm {appliedVoucher.discount_type === "percent"
                      ? `${appliedVoucher.discount_value}%`
                      : fmt(Number(appliedVoucher.discount_value))}
                  </div>
                </div>
                <button type="button" onClick={removeVoucher}
                  className="p-1.5 hover:bg-white rounded-md"><X className="size-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Nhập mã voucher" className="uppercase font-mono"
                  {...register("voucher_code")} />
                <Button type="button" variant="secondary" onClick={applyVoucher} disabled={checkingVoucher}>
                  {checkingVoucher ? "..." : "Áp dụng"}
                </Button>
              </div>
            )}
          </section>

          {/* Sales + commission */}
          <section className="rounded-xl border border-hairline p-4 space-y-3">
            <div className="font-bold text-brand-dark">Người bán & Hoa hồng</div>
            <div className="grid grid-cols-[1fr_140px] gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Người bán</Label>
                <Controller control={control} name="sales_staff_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn nhân sự" /></SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name ?? s.email} · <span className="text-ink-muted">{s.role}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">% Hoa hồng</Label>
                <Input type="number" step="0.1" min={0} max={100}
                  {...register("commission_rate", { valueAsNumber: true })} />
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-xl border-2 border-brand p-4 bg-brand-soft/30 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Tạm tính</span>
              <span className="font-bold">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Giảm giá</span>
              <span className="font-bold text-red-600">{discountAmount > 0 ? "-" + fmt(discountAmount) : "—"}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-brand/30">
              <span className="font-bold">Tổng thanh toán</span>
              <span className="font-black text-brand-dark">{fmt(total)}</span>
            </div>
          </section>

          <SheetFooter className="sticky bottom-0 bg-white pt-3 border-t border-hairline">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button type="submit" disabled={isSubmitting || subtotal <= 0}>
              {isSubmitting ? "Đang lưu..." : "Lưu đơn hàng"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
