import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Loader2, Pencil, Plus, Upload, X } from "lucide-react";
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

export const Route = createFileRoute("/admin/catalog")({
  component: AdminCatalog,
});

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  default_sessions: number;
  sku: string | null;
  cost_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  is_hidden: boolean | null;
  image_url: string | null;
};

type FormState = {
  id: string | null;
  name: string;
  sku: string;
  description: string;
  cost_price: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  default_sessions: string;
  image_url: string;
  is_hidden: boolean;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  sku: "",
  description: "",
  cost_price: "",
  price: "",
  sale_price: "",
  stock_quantity: "0",
  default_sessions: "1",
  image_url: "",
  is_hidden: false,
};

const BUCKET = "product-images";
// 10-year expiry — signed URLs are used because the workspace blocks public buckets.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

const formatVND = (n: number | null | undefined) =>
  n == null || n === 0
    ? "—"
    : new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";

function AdminCatalog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const listQ = useQuery({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const rows = listQ.data ?? [];

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setForm({
      id: s.id,
      name: s.name ?? "",
      sku: s.sku ?? "",
      description: s.description ?? "",
      cost_price: s.cost_price != null ? String(s.cost_price) : "",
      price: s.price != null ? String(s.price) : "",
      sale_price: s.sale_price != null ? String(s.sale_price) : "",
      stock_quantity: s.stock_quantity != null ? String(s.stock_quantity) : "0",
      default_sessions:
        s.default_sessions != null ? String(s.default_sessions) : "1",
      image_url: s.image_url ?? "",
      is_hidden: s.is_hidden ?? false,
    });
    setOpen(true);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp ảnh (JPG, PNG, WEBP...).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (sErr) throw sErr;
      setForm((p) => ({ ...p, image_url: signed.signedUrl }));
      toast.success("Đã tải ảnh lên.");
    } catch (e) {
      toast.error(`Upload thất bại: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void uploadFile(f);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void uploadFile(f);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Vui lòng nhập tên sản phẩm.");
      if (!form.price || Number(form.price) < 0)
        throw new Error("Vui lòng nhập giá bán hợp lệ.");
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        cost_price: form.cost_price ? Number(form.cost_price) : 0,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
        default_sessions: form.default_sessions
          ? Number(form.default_sessions)
          : 1,
        image_url: form.image_url.trim() || null,
        is_hidden: form.is_hidden,
      };
      if (form.id) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.");
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      setOpen(false);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_hidden: next })
        .eq("id", id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      toast.success(next ? "Đã tạm ẩn sản phẩm." : "Đã hiển thị sản phẩm.");
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
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
            Quản lý Sản phẩm & Dịch vụ
          </h1>
          <p className="font-body text-brand-muted text-sm mt-2">
            {listQ.isLoading
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

      {listQ.error && (
        <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-card p-3">
          {(listQ.error as Error).message}
        </div>
      )}

      <div className="bg-brand-surface rounded-card border border-brand-border shadow-sm p-6">
        <div className="overflow-auto">
          <table className="w-full min-w-[1024px] border-collapse">
            <thead>
              <tr className="border-b border-brand-border">
                {[
                  "Hình ảnh",
                  "Tên sản phẩm",
                  "SKU",
                  "Giá nhập",
                  "Giá bán",
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
              {rows.length === 0 && !listQ.isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-12 text-center text-brand-muted font-medium"
                  >
                    Chưa có sản phẩm nào. Bấm "Thêm sản phẩm mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const stock = p.stock_quantity ?? 0;
                  const lowStock = stock < 5;
                  const hidden = p.is_hidden ?? false;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-brand-border/60 hover:bg-brand-bg/40"
                    >
                      <td className="px-3 py-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-14 w-20 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-14 w-20 rounded-md bg-brand-bg grid place-items-center text-brand-muted">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-brand-text max-w-[240px]">
                        <div className="line-clamp-2">{p.name}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-muted font-mono">
                        {p.sku ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-muted">
                        {formatVND(p.cost_price)}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-text font-medium">
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
                            checked={!hidden}
                            onCheckedChange={(v) =>
                              toggleHidden.mutate({ id: p.id, next: !v })
                            }
                            disabled={toggleHidden.isPending}
                          />
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                              !hidden
                                ? "bg-status-success text-white"
                                : "bg-brand-primary-light text-brand-primary-dark"
                            }`}
                          >
                            {!hidden ? "Đang bán" : "Tạm ẩn"}
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
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {form.id ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              Nhập đầy đủ thông tin để hiển thị trên trang bán hàng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Drag & drop image upload */}
            <div className="space-y-1.5">
              <Label>Ảnh sản phẩm</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer border-2 border-dashed rounded-card p-4 transition-colors ${
                  dragOver
                    ? "border-brand-primary bg-brand-primary-light/40"
                    : "border-brand-border bg-brand-bg/40 hover:border-brand-primary/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                {form.image_url ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="h-24 w-32 object-cover rounded-md border border-brand-border"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-brand-text font-medium">
                        Đã tải ảnh lên
                      </div>
                      <div className="text-xs text-brand-muted mt-0.5">
                        Bấm để chọn ảnh khác, hoặc kéo thả để thay thế.
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((p) => ({ ...p, image_url: "" }));
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-status-error hover:underline"
                      >
                        <X size={12} /> Xoá ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    {uploading ? (
                      <>
                        <Loader2
                          size={28}
                          className="text-brand-primary animate-spin mb-2"
                        />
                        <div className="text-sm text-brand-text font-medium">
                          Đang tải ảnh lên...
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload
                          size={28}
                          className="text-brand-muted mb-2"
                        />
                        <div className="text-sm text-brand-text font-medium">
                          Kéo thả ảnh vào đây, hoặc bấm để chọn
                        </div>
                        <div className="text-xs text-brand-muted mt-1">
                          JPG, PNG, WEBP · tối đa 5MB
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tên sản phẩm *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã SP (SKU)</Label>
                <Input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sku: e.target.value }))
                  }
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

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Giá nhập (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.cost_price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cost_price: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giá bán (VND) *</Label>
                <Input
                  required
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Giá KM (VND)</Label>
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
              <Label>Số buổi liệu trình mặc định</Label>
              <Input
                type="number"
                min={1}
                value={form.default_sessions}
                onChange={(e) =>
                  setForm((p) => ({ ...p, default_sessions: e.target.value }))
                }
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
                checked={!form.is_hidden}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, is_hidden: !v }))
                }
              />
              <div>
                <div className="text-sm font-semibold text-brand-text">
                  {!form.is_hidden ? "Đang bán" : "Tạm ẩn"}
                </div>
                <div className="text-xs text-brand-muted">
                  Sản phẩm tạm ẩn sẽ không hiển thị công khai.
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={save.isPending || uploading}>
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
