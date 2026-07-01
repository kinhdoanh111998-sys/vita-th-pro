import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Pencil, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/products")({
  component: PortalProducts,
});

type Product = {
  id: string;
  name: string | null;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  gallery: unknown;
};

type FormState = {
  id: string | null;
  name: string;
  sku: string;
  short_description: string;
  description: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  image: string;
  is_active: boolean;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  sku: "",
  short_description: "",
  description: "",
  price: "",
  sale_price: "",
  stock_quantity: "0",
  image: "",
  is_active: true,
};

const formatVND = (n: number | null | undefined) =>
  n == null || n === 0
    ? "—"
    : new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function firstImage(gallery: unknown): string | null {
  if (Array.isArray(gallery)) {
    const s = gallery.find((x) => typeof x === "string" && x);
    return (s as string) ?? null;
  }
  if (typeof gallery === "string" && gallery.trim()) {
    if (gallery.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(gallery);
        if (Array.isArray(parsed))
          return parsed.find((x) => typeof x === "string") ?? null;
      } catch {
        /* noop */
      }
    }
    return gallery;
  }
  return null;
}

function PortalProducts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const productsQ = useQuery({
    queryKey: ["portal", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const rows = productsQ.data ?? [];

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name ?? "",
      sku: p.sku ?? "",
      short_description: p.short_description ?? "",
      description: p.description ?? "",
      price: p.price != null ? String(p.price) : "",
      sale_price: p.sale_price != null ? String(p.sale_price) : "",
      stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "0",
      image: firstImage(p.gallery) ?? "",
      is_active: p.is_active ?? true,
    });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Vui lòng nhập tên sản phẩm.");
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        price: form.price ? Number(form.price) : 0,
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
        is_active: form.is_active,
        gallery: form.image.trim() ? [form.image.trim()] : [],
      };
      if (form.id) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.");
      qc.invalidateQueries({ queryKey: ["portal", "products"] });
      setOpen(false);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: next })
        .eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      toast.success(next ? "Đã bật hiển thị sản phẩm." : "Đã tạm ẩn sản phẩm.");
      qc.invalidateQueries({ queryKey: ["portal", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-text">
            Quản lý Kho Sản phẩm & Thiết bị
          </h1>
          <p className="font-body text-brand-muted text-sm mt-2">
            {productsQ.isLoading
              ? "Đang tải danh sách..."
              : `${rows.length} sản phẩm trong kho`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-[44px] px-5 rounded-[8px] bg-brand-primary hover:bg-brand-primary-dark text-white font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Thêm sản phẩm mới
        </button>
      </div>

      {productsQ.error && (
        <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-card p-3">
          {(productsQ.error as Error).message}
        </div>
      )}

      <div className="bg-brand-surface rounded-card border border-brand-border shadow-sm p-6">
        <div className="overflow-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-brand-border">
                {[
                  "Hình ảnh",
                  "Tên sản phẩm",
                  "SKU",
                  "Giá gốc",
                  "Giá KM",
                  "Tồn kho",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-3 text-xs font-bold uppercase tracking-wider text-brand-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !productsQ.isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-12 text-center text-brand-muted font-medium"
                  >
                    Chưa có sản phẩm nào. Bấm "Thêm sản phẩm mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const img = firstImage(p.gallery);
                  const stock = p.stock_quantity ?? 0;
                  const lowStock = stock < 5;
                  const active = p.is_active ?? true;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-brand-border/60 hover:bg-brand-bg/40"
                    >
                      <td className="px-3 py-3">
                        {img ? (
                          <img
                            src={img}
                            alt={p.name ?? ""}
                            className="h-14 w-20 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-14 w-20 rounded-md bg-brand-bg grid place-items-center text-brand-muted">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-brand-text max-w-[280px]">
                        <div className="line-clamp-2">{p.name ?? "—"}</div>
                        {p.short_description && (
                          <div className="text-xs text-brand-muted line-clamp-1 mt-0.5">
                            {p.short_description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-muted font-mono">
                        {p.sku ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-text">
                        {formatVND(p.price)}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-primary font-semibold">
                        {formatVND(p.sale_price)}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <span
                          className={
                            lowStock
                              ? "text-status-error font-bold"
                              : "text-brand-text font-medium"
                          }
                        >
                          {stock}
                          {lowStock && (
                            <span className="ml-1 text-xs">(sắp hết)</span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={active}
                            onCheckedChange={(v) =>
                              toggleActive.mutate({ id: p.id, next: v })
                            }
                            disabled={toggleActive.isPending}
                          />
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                              active
                                ? "bg-status-success text-white"
                                : "bg-brand-primary-light text-brand-primary-dark"
                            }`}
                          >
                            {active ? "Đang bán" : "Tạm ẩn"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] border border-brand-border bg-brand-surface hover:bg-brand-bg text-sm font-medium text-brand-text transition-colors"
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setForm(EMPTY);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {form.id ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              Thông tin sản phẩm hiển thị trên trang /products công khai.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên sản phẩm *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="VD: MAY-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tồn kho</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock_quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stock_quantity: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Giá gốc (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giá khuyến mãi (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sale_price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sale_price: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ảnh sản phẩm (URL)</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả ngắn</Label>
              <Input
                value={form.short_description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, short_description: e.target.value }))
                }
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả chi tiết</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-brand-bg rounded-card border border-brand-border">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
              <div>
                <div className="text-sm font-semibold text-brand-text">
                  {form.is_active ? "Đang bán" : "Tạm ẩn"}
                </div>
                <div className="text-xs text-brand-muted">
                  Sản phẩm tạm ẩn sẽ không hiển thị trên trang /products.
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending
                  ? "Đang lưu..."
                  : form.id
                    ? "Cập nhật"
                    : "Thêm sản phẩm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
