import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  Plus, Search, Copy, Pencil, Trash2, Ticket, Percent, DollarSign,
  Calendar as CalIcon, Image as ImageIcon, X, Upload, Users, User, ShoppingBag,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/admin/voucher")({
  component: VoucherPage,
});

type DiscountType = "percent" | "amount";
type Voucher = {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string | null;
  valid_to: string | null;
  cover_image: string | null;
  headline: string | null;
  sub_headline: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
};
type Customer = { id: string; name: string; phone: string | null };
type CatalogItem = { id: string; name: string; type: "product" | "service"; price: number };

type ApplyScope = "all" | "group" | "specific";

type FormValues = {
  code: string;
  headline: string;
  sub_headline: string;
  cover_image: string;
  discount_type: DiscountType;
  discount_percent: string;
  discount_amount: string;
  valid_from: string;
  valid_to: string;
  usage_limit: string;
  is_active: boolean;
  apply_scope: ApplyScope;
  customer_group: string;
  selected_customer_ids: string[];
  selected_item_ids: string[]; // item_id::item_type
};

const CUSTOMER_GROUPS = ["Khách VIP", "Khách mới", "Khách thân thiết"];

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "VITA" + s;
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("vi-VN");
}
function toInputDate(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function VoucherPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [prefill, setPrefill] = useState<Partial<FormValues> | null>(null);

  const vouchersQ = useQuery({
    queryKey: ["vouchers", "list"],
    queryFn: async (): Promise<Voucher[]> => {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Voucher[];
    },
  });

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

  const catalogQ = useQuery({
    queryKey: ["services", "catalog-all"],
    queryFn: async (): Promise<CatalogItem[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,type,price")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CatalogItem[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (vouchersQ.data ?? []).filter((v) => {
      if (statusFilter === "active" && !v.is_active) return false;
      if (statusFilter === "inactive" && v.is_active) return false;
      if (!s) return true;
      return (
        v.code.toLowerCase().includes(s) ||
        (v.headline ?? "").toLowerCase().includes(s)
      );
    });
  }, [vouchersQ.data, search, statusFilter]);

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("vouchers").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái voucher");
      qc.invalidateQueries({ queryKey: ["vouchers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lỗi cập nhật"),
  });

  const deleteVoucher = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vouchers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá voucher");
      qc.invalidateQueries({ queryKey: ["vouchers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lỗi xoá"),
  });

  const openCreate = () => {
    setEditing(null);
    setPrefill(null);
    setOpen(true);
  };

  const openEdit = async (v: Voucher) => {
    // Load conditions + customers for prefill
    const [{ data: cond }, { data: cus }] = await Promise.all([
      supabase.from("voucher_conditions").select("item_id,item_type").eq("voucher_id", v.id),
      supabase.from("voucher_customers").select("customer_id").eq("voucher_id", v.id),
    ]);
    setEditing(v);
    setPrefill({
      code: v.code,
      headline: v.headline ?? "",
      sub_headline: v.sub_headline ?? "",
      cover_image: v.cover_image ?? "",
      discount_type: v.discount_type,
      discount_percent: v.discount_type === "percent" ? String(v.discount_value) : "",
      discount_amount: v.discount_type === "amount" ? String(v.discount_value) : "",
      valid_from: toInputDate(v.valid_from),
      valid_to: toInputDate(v.valid_to),
      usage_limit: v.usage_limit != null ? String(v.usage_limit) : "",
      is_active: v.is_active,
      apply_scope: (cus?.length ?? 0) > 0 ? "specific" : "all",
      customer_group: "",
      selected_customer_ids: (cus ?? []).map((c) => c.customer_id as string),
      selected_item_ids: (cond ?? []).map((c) => `${c.item_id}::${c.item_type}`),
    });
    setOpen(true);
  };

  const cloneVoucher = async (v: Voucher) => {
    const [{ data: cond }, { data: cus }] = await Promise.all([
      supabase.from("voucher_conditions").select("item_id,item_type").eq("voucher_id", v.id),
      supabase.from("voucher_customers").select("customer_id").eq("voucher_id", v.id),
    ]);
    setEditing(null); // create-new
    setPrefill({
      code: "", // để trống tự sinh
      headline: v.headline ?? "",
      sub_headline: v.sub_headline ?? "",
      cover_image: v.cover_image ?? "",
      discount_type: v.discount_type,
      discount_percent: v.discount_type === "percent" ? String(v.discount_value) : "",
      discount_amount: v.discount_type === "amount" ? String(v.discount_value) : "",
      valid_from: toInputDate(v.valid_from),
      valid_to: toInputDate(v.valid_to),
      usage_limit: v.usage_limit != null ? String(v.usage_limit) : "",
      is_active: v.is_active,
      apply_scope: (cus?.length ?? 0) > 0 ? "specific" : "all",
      customer_group: "",
      selected_customer_ids: (cus ?? []).map((c) => c.customer_id as string),
      selected_item_ids: (cond ?? []).map((c) => `${c.item_id}::${c.item_type}`),
    });
    setOpen(true);
    toast.info("Đã nhân bản voucher — mã mới sẽ tự sinh khi lưu");
  };

  return (
    <>
      <AdminTopbar
        title="Voucher / Khuyến mãi"
        subtitle="Quản lý mã giảm giá – Điều kiện áp dụng, đối tượng khách hàng và phạm vi sản phẩm/dịch vụ."
      />

      <section className="bg-white border border-hairline rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 border-b border-hairline">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
              <Input
                placeholder="Tìm mã hoặc headline..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[260px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4 mr-1.5 inline" /> Tạo Voucher mới
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-soft/40 text-left">
              <tr className="text-ink-muted">
                <th className="px-4 py-3 font-bold">Ảnh</th>
                <th className="px-4 py-3 font-bold">Mã</th>
                <th className="px-4 py-3 font-bold">Headline</th>
                <th className="px-4 py-3 font-bold">Giảm giá</th>
                <th className="px-4 py-3 font-bold">Thời hạn</th>
                <th className="px-4 py-3 font-bold">Sử dụng</th>
                <th className="px-4 py-3 font-bold">Kích hoạt</th>
                <th className="px-4 py-3 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchersQ.isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-muted">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  <Ticket className="mx-auto size-8 mb-2 opacity-50" />
                  Chưa có voucher nào.
                </td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id} className="border-t border-hairline hover:bg-brand-soft/20">
                  <td className="px-4 py-3">
                    {v.cover_image ? (
                      <img src={v.cover_image} alt="" className="size-12 rounded-lg object-cover border border-hairline" />
                    ) : (
                      <div className="size-12 rounded-lg bg-brand-soft grid place-items-center text-brand-dark">
                        <ImageIcon className="size-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-brand text-white font-black text-[13px] tracking-wide">{v.code}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-brand-dark">{v.headline || "—"}</div>
                    {v.sub_headline && <div className="text-xs text-ink-muted">{v.sub_headline}</div>}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {v.discount_type === "percent"
                      ? <span className="inline-flex items-center gap-1"><Percent className="size-3.5" />{v.discount_value}%</span>
                      : <span className="inline-flex items-center gap-1"><DollarSign className="size-3.5" />{Number(v.discount_value).toLocaleString("vi-VN")}₫</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <div>{fmtDate(v.valid_from)}</div>
                    <div className="text-ink-muted">→ {fmtDate(v.valid_to)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold">{v.used_count}</span>
                    <span className="text-ink-muted">/{v.usage_limit ?? "∞"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={v.is_active}
                      onCheckedChange={(val) => toggleActive.mutate({ id: v.id, value: val })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => cloneVoucher(v)}
                        className="p-2 rounded-lg hover:bg-brand-soft text-brand-dark"
                        title="Nhân bản"
                      ><Copy className="size-4" /></button>
                      <button
                        onClick={() => openEdit(v)}
                        className="p-2 rounded-lg hover:bg-brand-soft text-brand-dark"
                        title="Chỉnh sửa"
                      ><Pencil className="size-4" /></button>
                      <button
                        onClick={() => {
                          if (confirm(`Xoá voucher ${v.code}?`)) deleteVoucher.mutate(v.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Xoá"
                      ><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <VoucherFormDialog
        key={editing?.id ?? (prefill ? "clone" : "new") + String(open)}
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        prefill={prefill}
        customers={customersQ.data ?? []}
        catalog={catalogQ.data ?? []}
        onSaved={() => {
          setOpen(false);
          qc.invalidateQueries({ queryKey: ["vouchers"] });
        }}
      />
    </>
  );
}

/* ============================================================
   FORM DIALOG
============================================================ */
function VoucherFormDialog({
  open, onOpenChange, editing, prefill, customers, catalog, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Voucher | null;
  prefill: Partial<FormValues> | null;
  customers: Customer[];
  catalog: CatalogItem[];
  onSaved: () => void;
}) {
  const defaults: FormValues = {
    code: "",
    headline: "",
    sub_headline: "",
    cover_image: "",
    discount_type: "percent",
    discount_percent: "10",
    discount_amount: "",
    valid_from: toInputDate(new Date().toISOString()),
    valid_to: "",
    usage_limit: "",
    is_active: true,
    apply_scope: "all",
    customer_group: "",
    selected_customer_ids: [],
    selected_item_ids: [],
    ...(prefill ?? {}),
  };

  const {
    register, handleSubmit, control, watch, setValue, reset, formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: defaults });

  useEffect(() => { reset(defaults); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [prefill, editing?.id]);

  const discountType = watch("discount_type");
  const applyScope = watch("apply_scope");
  const selectedCustomerIds = watch("selected_customer_ids");
  const selectedItemIds = watch("selected_item_ids");

  const [customerSearch, setCustomerSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  const customerResults = useMemo(() => {
    const s = customerSearch.trim().toLowerCase();
    if (!s) return [];
    return customers
      .filter((c) => c.name.toLowerCase().includes(s) || (c.phone ?? "").includes(s))
      .slice(0, 8);
  }, [customers, customerSearch]);

  const filteredItems = useMemo(() => {
    const s = itemSearch.trim().toLowerCase();
    if (!s) return catalog;
    return catalog.filter((i) => i.name.toLowerCase().includes(s));
  }, [catalog, itemSearch]);

  const toggleCustomer = (id: string) => {
    const cur = selectedCustomerIds ?? [];
    setValue("selected_customer_ids", cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };
  const toggleItem = (key: string) => {
    const cur = selectedItemIds ?? [];
    setValue("selected_item_ids", cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key]);
  };

  const onSubmit = async (values: FormValues) => {
    const code = values.code.trim() || genCode();
    const discount_value = values.discount_type === "percent"
      ? Number(values.discount_percent || 0)
      : Number(values.discount_amount || 0);

    if (discount_value <= 0) {
      toast.error("Giá trị giảm phải lớn hơn 0"); return;
    }
    if (values.discount_type === "percent" && discount_value > 100) {
      toast.error("Giảm % không vượt quá 100"); return;
    }

    const payload = {
      code,
      headline: values.headline || null,
      sub_headline: values.sub_headline || null,
      cover_image: values.cover_image || null,
      discount_type: values.discount_type,
      discount_value,
      valid_from: values.valid_from ? new Date(values.valid_from).toISOString() : null,
      valid_to: values.valid_to ? new Date(values.valid_to + "T23:59:59").toISOString() : null,
      usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
      is_active: values.is_active,
    };

    try {
      let voucherId: string;
      if (editing) {
        const { error } = await supabase.from("vouchers").update(payload).eq("id", editing.id);
        if (error) throw error;
        voucherId = editing.id;
        // clean old links
        await supabase.from("voucher_customers").delete().eq("voucher_id", voucherId);
        await supabase.from("voucher_conditions").delete().eq("voucher_id", voucherId);
      } else {
        const { data, error } = await supabase.from("vouchers").insert(payload).select("id").single();
        if (error) throw error;
        voucherId = data.id as string;
      }

      // Customer scope
      if (values.apply_scope === "specific" && values.selected_customer_ids.length > 0) {
        const rows = values.selected_customer_ids.map((cid) => ({
          voucher_id: voucherId, customer_id: cid,
        }));
        const { error } = await supabase.from("voucher_customers").insert(rows);
        if (error) throw error;
      }

      // Item scope
      if (values.selected_item_ids.length > 0) {
        const rows = values.selected_item_ids.map((key) => {
          const [item_id, item_type] = key.split("::");
          return { voucher_id: voucherId, item_id, item_type };
        });
        const { error } = await supabase.from("voucher_conditions").insert(rows);
        if (error) throw error;
      }

      toast.success(editing ? "Đã cập nhật voucher" : `Đã tạo voucher ${code}`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu voucher");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="size-5 text-brand" />
            {editing ? `Chỉnh sửa voucher ${editing.code}` : "Tạo voucher mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mã voucher {!editing && <span className="text-ink-muted font-normal">(trống → tự sinh VITAxxxx)</span>}</Label>
              <Input placeholder="VITAABCD" {...register("code")} className="uppercase font-mono font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <div className="flex items-center h-10 gap-2">
                <Controller
                  control={control} name="is_active"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <span className="text-sm font-semibold">{watch("is_active") ? "Kích hoạt" : "Tạm dừng"}</span>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Headline (Tiêu đề chính)</Label>
              <Input placeholder="VD: Giảm 20% liệu trình chăm sóc da" {...register("headline")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Tiêu đề phụ</Label>
              <Textarea rows={2} placeholder="Mô tả ngắn về chương trình khuyến mãi" {...register("sub_headline")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Ảnh bìa (link URL)</Label>
              <div className="flex gap-2">
                <Input placeholder="https://..." {...register("cover_image")} />
                <Button type="button" variant="secondary" onClick={() => toast.info("Chức năng upload ảnh sẽ dùng bucket product-images")}><Upload className="size-4" /></Button>
              </div>
              {watch("cover_image") && (
                <img src={watch("cover_image")} alt="" className="mt-2 h-24 rounded-lg object-cover border border-hairline" />
              )}
            </div>
          </div>

          {/* Discount */}
          <div className="rounded-xl border border-hairline p-4 space-y-3 bg-brand-soft/20">
            <div className="font-bold text-brand-dark flex items-center gap-2"><Percent className="size-4" /> Cấu hình giảm giá</div>
            <Controller
              control={control} name="discount_type"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {(["percent", "amount"] as DiscountType[]).map((t) => (
                    <label key={t}
                      className={`cursor-pointer rounded-xl border-2 p-3 flex items-center gap-2 transition ${
                        field.value === t ? "border-brand bg-white" : "border-hairline bg-white/60"
                      }`}
                    >
                      <input type="radio" checked={field.value === t} onChange={() => field.onChange(t)} className="accent-brand" />
                      {t === "percent" ? <Percent className="size-4" /> : <DollarSign className="size-4" />}
                      <span className="font-bold">{t === "percent" ? "Giảm theo %" : "Giảm số tiền cố định"}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={discountType !== "percent" ? "text-ink-muted" : ""}>Giảm (%)</Label>
                <Input type="number" min={1} max={100} placeholder="10" disabled={discountType !== "percent"}
                  {...register("discount_percent")} />
              </div>
              <div className="space-y-1">
                <Label className={discountType !== "amount" ? "text-ink-muted" : ""}>Giảm (VNĐ)</Label>
                <Input type="number" min={1000} step={1000} placeholder="50000" disabled={discountType !== "amount"}
                  {...register("discount_amount")} />
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><CalIcon className="size-3.5" /> Bắt đầu</Label>
              <Input type="date" {...register("valid_from")} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><CalIcon className="size-3.5" /> Kết thúc</Label>
              <Input type="date" {...register("valid_to")} />
            </div>
            <div className="space-y-1.5">
              <Label>Giới hạn lượt dùng</Label>
              <Input type="number" min={1} placeholder="Không giới hạn" {...register("usage_limit")} />
            </div>
          </div>

          {/* Apply Scope */}
          <div className="rounded-xl border border-hairline p-4 space-y-3">
            <div className="font-bold text-brand-dark flex items-center gap-2"><Users className="size-4" /> Đối tượng khách hàng</div>
            <Controller
              control={control} name="apply_scope"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khách hàng</SelectItem>
                    <SelectItem value="group">Nhóm khách hàng cụ thể</SelectItem>
                    <SelectItem value="specific">Chọn đích danh khách hàng</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {applyScope === "group" && (
              <Controller
                control={control} name="customer_group"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Chọn nhóm..." /></SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            )}

            {applyScope === "specific" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
                    <Input placeholder="Tìm tên / SĐT khách hàng..." value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Button type="button" variant="secondary" onClick={() => toast.info("Mock: Upload danh sách CSV")}>
                    <Upload className="size-4 mr-1" /> CSV
                  </Button>
                </div>
                {customerResults.length > 0 && (
                  <div className="rounded-lg border border-hairline bg-white divide-y">
                    {customerResults.map((c) => (
                      <button type="button" key={c.id} onClick={() => { toggleCustomer(c.id); setCustomerSearch(""); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand-soft flex items-center justify-between">
                        <span><User className="size-3.5 inline mr-1" />{c.name} <span className="text-ink-muted">· {c.phone ?? "—"}</span></span>
                        {selectedCustomerIds?.includes(c.id) && <Badge>Đã chọn</Badge>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {selectedCustomerIds?.map((id) => {
                    const c = customers.find((x) => x.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 bg-brand-soft text-brand-dark px-2 py-1 rounded-full text-xs font-semibold">
                        {c?.name ?? id.slice(0, 6)}
                        <button type="button" onClick={() => toggleCustomer(id)}><X className="size-3" /></button>
                      </span>
                    );
                  })}
                  {selectedCustomerIds?.length === 0 && (
                    <span className="text-xs text-ink-muted">Chưa chọn khách hàng nào.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Item scope */}
          <div className="rounded-xl border border-hairline p-4 space-y-3">
            <div className="font-bold text-brand-dark flex items-center gap-2">
              <ShoppingBag className="size-4" /> Phạm vi áp dụng (Sản phẩm / Dịch vụ)
              <span className="ml-auto text-xs font-normal text-ink-muted">
                {selectedItemIds?.length ?? 0} mục · để trống = áp dụng toàn bộ
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
              <Input placeholder="Tìm sản phẩm / dịch vụ..." value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-hairline bg-white">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-sm text-ink-muted text-center">Không có kết quả</div>
              ) : filteredItems.map((it) => {
                const key = `${it.id}::${it.type}`;
                const checked = selectedItemIds?.includes(key);
                return (
                  <label key={key} className="flex items-center gap-3 px-3 py-2 border-b border-hairline last:border-0 hover:bg-brand-soft/30 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggleItem(key)} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      it.type === "product" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>{it.type === "product" ? "SP" : "DV"}</span>
                    <span className="flex-1 text-sm font-semibold">{it.name}</span>
                    <span className="text-xs text-ink-muted">{Number(it.price).toLocaleString("vi-VN")}₫</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo voucher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
