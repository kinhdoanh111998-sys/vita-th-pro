import { useRef, useState, type FormEvent, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Loader2, Pencil, Plus, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORY_SUGGESTIONS,
  productCategoryLabel,
} from "@/lib/catalogCategories";

type ItemType = "product" | "service";

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
  image_urls: string[] | null;
  type: ItemType | null;
  category: string | null;
};

type FormState = {
  id: string | null;
  name: string;
  sku: string;
  description: string;
  category: string;
  cost_price: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  default_sessions: string;
  image_urls: string[];
  is_hidden: boolean;
};

const BUCKET = "product-images";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

const formatVND = (n: number | null | undefined) =>
  n == null || n === 0
    ? "—"
    : new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";

interface Props {
  lockedType: ItemType;
  title: string;
  subtitle?: string;
}

export function AdminCatalogView({ lockedType, title, subtitle }: Props) {
  const isService = lockedType === "service";
  const QK = ["admin", "services", lockedType] as const;
  const EMPTY: FormState = {
    id: null,
    name: "",
    sku: "",
    description: "",
    category: "",
    cost_price: "",
    price: "",
    sale_price: "",
    stock_quantity: "0",
    default_sessions: "1",
    image_urls: [],
    is_hidden: false,
  };

  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const listQ = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("type", lockedType)
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
    const urls =
      s.image_urls && s.image_urls.length > 0
        ? s.image_urls
        : s.image_url
          ? [s.image_url]
          : [];
    setForm({
      id: s.id,
      name: s.name ?? "",
      sku: s.sku ?? "",
      description: s.description ?? "",
      category: s.category ?? "",
      cost_price: s.cost_price != null ? String(s.cost_price) : "",
      price: s.price != null ? String(s.price) : "",
      sale_price: s.sale_price != null ? String(s.sale_price) : "",
      stock_quantity: s.stock_quantity != null ? String(s.stock_quantity) : "0",
      default_sessions:
        s.default_sessions != null ? String(s.default_sessions) : "1",
      image_urls: urls,
      is_hidden: s.is_hidden ?? false,
    });
    setOpen(true);
  };

  const uploadOne = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name}: không phải ảnh.`);
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name}: vượt quá 5MB.`);
      return null;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      toast.error(`${file.name}: ${upErr.message}`);
      return null;
    }
    const { data: signed, error: sErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (sErr) {
      toast.error(`${file.name}: ${sErr.message}`);
      return null;
    }
    return signed.signedUrl;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of arr) {
        const u = await uploadOne(f);
        if (u) urls.push(u);
      }
      if (urls.length > 0) {
        setForm((p) => ({ ...p, image_urls: [...p.image_urls, ...urls] }));
        toast.success(`Đã tải lên ${urls.length} ảnh.`);
      }
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void uploadFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) void uploadFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) =>
    setForm((p) => ({
      ...p,
      image_urls: p.image_urls.filter((_, i) => i !== idx),
    }));

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Vui lòng nhập tên.");
      if (!form.price || Number(form.price) < 0)
        throw new Error("Vui lòng nhập giá bán hợp lệ.");
      if (!isService && !form.category)
        throw new Error("Vui lòng chọn danh mục sản phẩm.");

      const payload = {
        type: lockedType,
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        cost_price: form.cost_price ? Number(form.cost_price) : 0,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
        default_sessions: isService
          ? form.default_sessions
            ? Number(form.default_sessions)
            : 1
          : 0,
        image_urls: form.image_urls,
        image_url: form.image_urls[0] ?? null,
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
    onSuccess: async () => {
      toast.success(form.id ? "Đã cập nhật." : "Đã thêm mới.");
      await qc.invalidateQueries({ queryKey: ["admin", "services"] });
      await qc.invalidateQueries({ queryKey: ["catalog", "services_public"] });
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
    onSuccess: async (next) => {
      toast.success(next ? "Đã tạm ẩn." : "Đã hiển thị.");
      await qc.invalidateQueries({ queryKey: ["admin", "services"] });
      await qc.invalidateQueries({ queryKey: ["catalog", "services_public"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <AdminTopbar
        title={title}
        subtitle={
          subtitle ??
          (listQ.isLoading
            ? "Đang tải..."
            : `${rows.length} ${isService ? "dịch vụ" : "sản phẩm"} trong danh mục`)
        }
        right={
          <button
            onClick={openCreate}
            className="h-[40px] px-4 rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Thêm mới
          </button>
        }
      />

      {listQ.error && (
        <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-card p-3 mb-4">
          {(listQ.error as Error).message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-hairline shadow-sm p-5">
        <div className="overflow-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-hairline">
                {[
                  "Ảnh",
                  "Tên",
                  "Danh mục",
                  "SKU",
                  "Giá bán",
                  "Giá KM",
                  isService ? "Số buổi" : "Tồn kho",
                  "Trạng thái",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-3 text-[11px] font-black uppercase tracking-wider text-ink-muted"
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
                    className="px-3 py-12 text-center text-ink-muted"
                  >
                    Chưa có mục nào. Bấm "Thêm mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const stock = p.stock_quantity ?? 0;
                  const lowStock = stock < 5;
                  const hidden = p.is_hidden ?? false;
                  const thumb =
                    (p.image_urls && p.image_urls[0]) || p.image_url || null;
                  const catLabel = isService
                    ? p.category ?? "—"
                    : productCategoryLabel(p.category);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-hairline/70 hover:bg-brand-bg/40"
                    >
                      <td className="px-3 py-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={p.name}
                            className="h-14 w-20 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-14 w-20 rounded-md bg-brand-bg grid place-items-center text-ink-muted">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-ink max-w-[260px]">
                        <div className="line-clamp-2">{p.name}</div>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="inline-flex px-2 py-1 rounded-full font-semibold bg-brand-bg text-ink">
                          {catLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-ink-muted font-mono">
                        {p.sku ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-ink font-medium">
                        {formatVND(p.price)}
                      </td>
                      <td className="px-3 py-3 text-sm text-brand-primary font-semibold">
                        {formatVND(p.sale_price)}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {isService ? (
                          <span className="text-ink font-medium">
                            {p.default_sessions ?? 1} buổi
                          </span>
                        ) : (
                          <span
                            className={
                              lowStock
                                ? "text-status-error font-bold"
                                : "text-ink font-medium"
                            }
                          >
                            {stock}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Switch
                          checked={!hidden}
                          onCheckedChange={(v) =>
                            toggleHidden.mutate({ id: p.id, next: !v })
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:text-brand-primary-dark"
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
        <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {form.id
                ? `Cập nhật ${isService ? "dịch vụ" : "sản phẩm"}`
                : `Thêm ${isService ? "dịch vụ" : "sản phẩm"} mới`}
            </DialogTitle>
            <DialogDescription>
              Nhập đầy đủ thông tin. Trường có dấu * là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Images */}
            <div className="space-y-1.5">
              <Label>Hình ảnh</Label>
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
                    : "border-hairline bg-brand-bg/40 hover:border-brand-primary/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                />
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  {uploading ? (
                    <>
                      <Loader2
                        size={26}
                        className="text-brand-primary animate-spin mb-2"
                      />
                      <div className="text-sm font-medium">
                        Đang tải ảnh lên...
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={26} className="text-ink-muted mb-2" />
                      <div className="text-sm font-medium">
                        Kéo thả nhiều ảnh, hoặc bấm để chọn
                      </div>
                      <div className="text-xs text-ink-muted mt-1">
                        JPG, PNG, WEBP · tối đa 5MB / ảnh
                      </div>
                    </>
                  )}
                </div>
              </div>

              {form.image_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {form.image_urls.map((u, i) => (
                    <div
                      key={u + i}
                      className="relative group aspect-square rounded-md overflow-hidden border border-hairline"
                    >
                      <img
                        src={u}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-brand-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                          Ảnh chính
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-status-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tên *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Danh mục {!isService && "*"}</Label>
              {isService ? (
                <>
                  <Input
                    list="service-cat-suggestions"
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    placeholder="VD: Chăm sóc da, Thải độc..."
                  />
                  <datalist id="service-cat-suggestions">
                    {SERVICE_CATEGORY_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </>
              ) : (
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mã (SKU)</Label>
                <Input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sku: e.target.value }))
                  }
                  placeholder={isService ? "VD: DV-001" : "VD: MAY-001"}
                />
              </div>
              {isService ? (
                <div className="space-y-1.5">
                  <Label>Số buổi mặc định</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.default_sessions}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        default_sessions: e.target.value,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Tồn kho</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        stock_quantity: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
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
              <Label>Mô tả</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-brand-bg rounded-card border border-hairline">
              <Switch
                checked={!form.is_hidden}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, is_hidden: !v }))
                }
              />
              <div>
                <div className="text-sm font-semibold">
                  {!form.is_hidden ? "Đang bán" : "Tạm ẩn"}
                </div>
                <div className="text-xs text-ink-muted">
                  Mục tạm ẩn sẽ không hiển thị công khai.
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
                    : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
