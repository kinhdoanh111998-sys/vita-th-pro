import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAdminCombos, formatVND, type Combo } from "@/lib/useCombos";

const BUCKET = "product-images";
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

type ItemRow = { service_id: string; quantity: number };

type ServiceOpt = {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  sale_price: number | null;
  image_url: string | null;
};

type FormState = {
  id: string | null;
  name: string;
  headline: string;
  subtitle: string;
  description: string;
  image_url: string;
  discount_type: "percent" | "amount";
  discount_value: string;
  is_hidden: boolean;
  items: ItemRow[];
};

const EMPTY: FormState = {
  id: null,
  name: "",
  headline: "",
  subtitle: "",
  description: "",
  image_url: "",
  discount_type: "percent",
  discount_value: "10",
  is_hidden: false,
  items: [],
};

function priceOfOpt(s: ServiceOpt) {
  return s.sale_price && s.sale_price > 0 ? s.sale_price : s.price;
}

export function AdminCombosView() {
  const qc = useQueryClient();
  const { data: combos = [], isLoading } = useAdminCombos();

  const { data: services = [] } = useQuery<ServiceOpt[]>({
    queryKey: ["combos", "service-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, type, price, sale_price, image_url")
        .eq("is_hidden", false)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        type: (r.type === "product" ? "product" : "service") as
          | "product"
          | "service",
        price: Number(r.price ?? 0),
        sale_price: r.sale_price != null ? Number(r.sale_price) : null,
        image_url: (r.image_url as string) ?? null,
      }));
    },
    staleTime: 60_000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");

  const openCreate = () => {
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (c: Combo) => {
    setForm({
      id: c.id,
      name: c.name,
      headline: c.headline ?? "",
      subtitle: c.subtitle ?? "",
      description: c.description ?? "",
      image_url: c.image_url ?? "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      is_hidden: c.is_hidden,
      items: c.items.map((i) => ({
        service_id: i.service_id,
        quantity: i.quantity,
      })),
    });
    setDialogOpen(true);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Không phải ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `combo-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);
      if (sErr) throw sErr;
      setForm((p) => ({ ...p, image_url: signed.signedUrl }));
      toast.success("Đã tải ảnh.");
    } catch (e) {
      toast.error((e as Error).message ?? "Lỗi tải ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const productOptions = useMemo(
    () =>
      services
        .filter((s) => s.type === "product")
        .filter((s) =>
          productQuery
            ? s.name.toLowerCase().includes(productQuery.toLowerCase())
            : true,
        ),
    [services, productQuery],
  );
  const serviceOptions = useMemo(
    () =>
      services
        .filter((s) => s.type === "service")
        .filter((s) =>
          serviceQuery
            ? s.name.toLowerCase().includes(serviceQuery.toLowerCase())
            : true,
        ),
    [services, serviceQuery],
  );

  const selectedMap = useMemo(() => {
    const m = new Map<string, ItemRow>();
    form.items.forEach((it) => m.set(it.service_id, it));
    return m;
  }, [form.items]);

  const toggleItem = (id: string) => {
    setForm((p) => {
      if (selectedMap.has(id)) {
        return { ...p, items: p.items.filter((i) => i.service_id !== id) };
      }
      return { ...p, items: [...p.items, { service_id: id, quantity: 1 }] };
    });
  };

  const setItemQty = (id: string, qty: number) => {
    setForm((p) => ({
      ...p,
      items: p.items.map((i) =>
        i.service_id === id ? { ...i, quantity: Math.max(1, qty) } : i,
      ),
    }));
  };

  const preview = useMemo(() => {
    const base = form.items.reduce((sum, it) => {
      const s = services.find((x) => x.id === it.service_id);
      return sum + (s ? priceOfOpt(s) * it.quantity : 0);
    }, 0);
    const v = Number(form.discount_value) || 0;
    const final =
      form.discount_type === "percent"
        ? Math.max(0, Math.round(base * (1 - v / 100)))
        : Math.max(0, Math.round(base - v));
    return { base, final, saved: Math.max(0, base - final) };
  }, [form.items, form.discount_type, form.discount_value, services]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Cần nhập tên combo.");
      if (form.items.length === 0)
        throw new Error("Cần chọn ít nhất 1 sản phẩm hoặc dịch vụ.");
      const dVal = Number(form.discount_value);
      if (Number.isNaN(dVal) || dVal < 0) throw new Error("Giá trị giảm không hợp lệ.");
      if (form.discount_type === "percent" && dVal > 100)
        throw new Error("Giảm theo % không quá 100.");

      const payload = {
        name,
        headline: form.headline.trim() || null,
        subtitle: form.subtitle.trim() || null,
        description: form.description,
        image_url: form.image_url.trim() || null,
        discount_type: form.discount_type,
        discount_value: dVal,
        is_hidden: form.is_hidden,
      };

      let comboId = form.id;
      if (comboId) {
        const { error } = await supabase
          .from("combos")
          .update(payload)
          .eq("id", comboId);
        if (error) throw error;
        await supabase.from("combo_items").delete().eq("combo_id", comboId);
      } else {
        const { data, error } = await supabase
          .from("combos")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        comboId = data.id as string;
      }

      if (form.items.length > 0) {
        const rows = form.items.map((it) => ({
          combo_id: comboId!,
          service_id: it.service_id,
          quantity: it.quantity,
        }));
        const { error } = await supabase.from("combo_items").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu combo.");
      qc.invalidateQueries({ queryKey: ["combos"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá combo.");
      qc.invalidateQueries({ queryKey: ["combos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMut.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold">
            Quản lý Combo đóng gói
          </h2>
          <p className="text-sm text-gray-500">
            Kết hợp nhiều sản phẩm và dịch vụ với mức giảm giá riêng.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Thêm Combo
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin inline mr-2" /> Đang tải...
        </div>
      ) : combos.length === 0 ? (
        <div className="py-16 text-center text-gray-500 border-2 border-dashed rounded-2xl">
          Chưa có combo nào. Bấm "Thêm Combo" để bắt đầu.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {combos.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-white border shrink-0">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 truncate">
                      {c.name}
                    </h3>
                    {c.is_hidden && (
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                        Đang ẩn
                      </span>
                    )}
                  </div>
                  {c.headline && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {c.headline}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                    {c.hasProduct && (
                      <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-semibold">
                        {c.items.filter((i) => i.service.type === "product").length} sản phẩm
                      </span>
                    )}
                    {c.hasService && (
                      <span className="bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-semibold">
                        {c.items.filter((i) => i.service.type === "service").length} dịch vụ
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between border-t pt-3">
                <div>
                  <div className="text-xs text-gray-400 line-through">
                    {formatVND(c.basePrice)}
                  </div>
                  <div className="text-lg font-black text-emerald-700">
                    {formatVND(c.finalPrice)}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    title="Sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xoá combo "${c.name}"?`))
                        deleteMut.mutate(c.id);
                    }}
                    className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                    title="Xoá"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Chỉnh sửa Combo" : "Thêm Combo mới"}
            </DialogTitle>
            <DialogDescription>
              Đóng gói nhiều sản phẩm/dịch vụ vào một combo có mức giảm riêng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tên Combo *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Combo Chăm sóc trọn gói"
                  required
                />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={form.headline}
                  onChange={(e) =>
                    setForm({ ...form, headline: e.target.value })
                  }
                  placeholder="Ưu đãi tháng 12"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Tiêu đề phụ</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm({ ...form, subtitle: e.target.value })
                  }
                  placeholder="Tiết kiệm 20% khi mua trọn combo"
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <Label>Ảnh đại diện</Label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border shrink-0">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex gap-2 items-center">
                  <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Đang tải..." : "Chọn ảnh"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) =>
                        e.target.files?.[0] && uploadFile(e.target.files[0])
                      }
                    />
                  </label>
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: "" })}
                      className="text-rose-600 text-sm font-medium"
                    >
                      Gỡ
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Mô tả chi tiết</Label>
              <RichTextEditor
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                placeholder="Mô tả combo, quyền lợi khách hàng..."
              />
            </div>

            {/* Product picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="mb-0">
                  Sản phẩm trong combo (
                  {form.items.filter((i) => {
                    const s = services.find((x) => x.id === i.service_id);
                    return s?.type === "product";
                  }).length}
                  )
                </Label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="h-8 pl-7 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <ItemGrid
                options={productOptions}
                selectedMap={selectedMap}
                onToggle={toggleItem}
                onQty={setItemQty}
              />
            </div>

            {/* Service picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="mb-0">
                  Dịch vụ trong combo (
                  {form.items.filter((i) => {
                    const s = services.find((x) => x.id === i.service_id);
                    return s?.type === "service";
                  }).length}
                  )
                </Label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    placeholder="Tìm dịch vụ..."
                    className="h-8 pl-7 pr-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <ItemGrid
                options={serviceOptions}
                selectedMap={selectedMap}
                onToggle={toggleItem}
                onQty={setItemQty}
              />
            </div>

            {/* Discount */}
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div>
                <Label>Loại giảm giá</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      discount_type: v as "percent" | "amount",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Theo phần trăm %</SelectItem>
                    <SelectItem value="amount">Theo số tiền VNĐ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Giá trị giảm{" "}
                  {form.discount_type === "percent" ? "(%)" : "(VNĐ)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between h-10 px-3 rounded-lg border">
                <span className="text-sm">Ẩn combo</span>
                <Switch
                  checked={form.is_hidden}
                  onCheckedChange={(v) => setForm({ ...form, is_hidden: v })}
                />
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-gray-600">
                Tổng gốc:{" "}
                <span className="line-through">{formatVND(preview.base)}</span>
                <br />
                Tiết kiệm:{" "}
                <span className="font-bold text-rose-600">
                  −{formatVND(preview.saved)}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Giá combo sau giảm
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {formatVND(preview.final)}
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium"
              >
                Huỷ
              </button>
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" /> Đang lưu...
                  </>
                ) : (
                  <>Lưu combo</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemGrid({
  options,
  selectedMap,
  onToggle,
  onQty,
}: {
  options: ServiceOpt[];
  selectedMap: Map<string, ItemRow>;
  onToggle: (id: string) => void;
  onQty: (id: string, qty: number) => void;
}) {
  if (options.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400 rounded-xl border-2 border-dashed">
        Không có mục nào.
      </div>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
      {options.map((s) => {
        const sel = selectedMap.get(s.id);
        return (
          <div
            key={s.id}
            className={`flex items-center gap-2 p-2 rounded-lg border ${
              sel
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              className="flex-1 flex items-center gap-2 min-w-0 text-left"
            >
              <div
                className={`w-4 h-4 rounded border-2 shrink-0 grid place-items-center ${
                  sel ? "bg-emerald-600 border-emerald-600" : "border-gray-300"
                }`}
              >
                {sel && <X className="w-3 h-3 text-white rotate-45" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{s.name}</div>
                <div className="text-xs text-gray-500">
                  {formatVND(priceOfOpt(s))}
                </div>
              </div>
            </button>
            {sel && (
              <input
                type="number"
                min={1}
                value={sel.quantity}
                onChange={(e) => onQty(s.id, Number(e.target.value) || 1)}
                className="w-14 h-8 text-sm text-center border border-gray-200 rounded"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
