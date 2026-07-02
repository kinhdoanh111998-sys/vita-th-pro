import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAllStores, type Store } from "@/lib/useStores";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/stores")({
  component: AdminStoresPage,
});

const BUCKET = "store-images";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

type FormState = {
  id: string | null;
  name: string;
  address: string;
  phone: string;
  hotline: string;
  email: string;
  open_hours: string;
  sort_order: string;
  is_active: boolean;
  images: string[];
  main_image: string | null;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  address: "",
  phone: "",
  hotline: "",
  email: "",
  open_hours: "",
  sort_order: "0",
  is_active: true,
  images: [],
  main_image: null,
};

function AdminStoresPage() {
  const qc = useQueryClient();
  const { data: stores = [], isLoading } = useAllStores();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (s: Store) => {
    setForm({
      id: s.id,
      name: s.name ?? "",
      address: s.address ?? "",
      phone: s.phone ?? "",
      hotline: s.hotline ?? "",
      email: s.email ?? "",
      open_hours: s.open_hours ?? "",
      sort_order: String(s.sort_order ?? 0),
      is_active: !!s.is_active,
      images: s.images ?? [],
      main_image: s.main_image ?? (s.images?.[0] ?? null),
    });
    setOpen(true);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: không phải ảnh`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: vượt 5MB`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) {
        toast.error(`${file.name}: ${upErr.message}`);
        continue;
      }
      const { data: signed, error: sErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (sErr) {
        toast.error(`${file.name}: ${sErr.message}`);
        continue;
      }
      uploaded.push(signed.signedUrl);
    }
    setForm((f) => {
      const next = [...f.images, ...uploaded];
      return {
        ...f,
        images: next,
        main_image: f.main_image ?? next[0] ?? null,
      };
    });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (url: string) => {
    setForm((f) => {
      const images = f.images.filter((u) => u !== url);
      const main_image = f.main_image === url ? images[0] ?? null : f.main_image;
      return { ...f, images, main_image };
    });
  };

  const saveMut = useMutation({
    mutationFn: async (payload: FormState) => {
      const row = {
        name: payload.name.trim(),
        address: payload.address.trim() || null,
        phone: payload.phone.trim() || null,
        hotline: payload.hotline.trim() || null,
        email: payload.email.trim() || null,
        open_hours: payload.open_hours.trim() || null,
        sort_order: Number(payload.sort_order) || 0,
        is_active: payload.is_active,
        images: payload.images,
        main_image: payload.main_image ?? payload.images[0] ?? null,
      };
      if (payload.id) {
        const { error } = await supabase.from("stores").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stores").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Đã cập nhật cửa hàng" : "Đã thêm cửa hàng");
      qc.invalidateQueries({ queryKey: ["stores"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá cửa hàng");
      qc.invalidateQueries({ queryKey: ["stores"] });
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên cửa hàng");
      return;
    }
    saveMut.mutate(form);
  };

  const deleteTarget = useMemo(() => stores.find((s) => s.id === deleteId) ?? null, [stores, deleteId]);

  return (
    <div className="space-y-4">
      <AdminTopbar
        title="Quản lý Cửa hàng"
        right={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Thêm cửa hàng
          </Button>
        }
      />

      <div className="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f7faf5] text-left text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tên cửa hàng</th>
                <th className="px-4 py-3">Địa chỉ</th>
                <th className="px-4 py-3">Hotline</th>
                <th className="px-4 py-3">Thứ tự</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                    <Loader2 className="w-4 h-4 animate-spin inline" /> Đang tải…
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-muted italic">
                    Chưa có cửa hàng nào.
                  </td>
                </tr>
              ) : (
                stores.map((s) => (
                  <tr key={s.id} className="border-t border-hairline hover:bg-[#fafcf7]">
                    <td className="px-4 py-3">
                      {s.main_image ? (
                        <img
                          src={s.main_image}
                          alt={s.name}
                          className="w-14 h-14 rounded-xl object-cover border border-hairline"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-amber-50 grid place-items-center text-xs text-ink-muted">
                          Không ảnh
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-ink">{s.name}</td>
                    <td className="px-4 py-3 text-ink-muted max-w-[280px] truncate">{s.address ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.hotline ?? "—"}</td>
                    <td className="px-4 py-3">{s.sort_order}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          s.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {s.is_active ? "Đang hoạt động" : "Đã tắt"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-dark hover:bg-brand-soft"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
                        className="ml-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xoá
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Centered Modal — same pattern as /admin/products */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Chỉnh sửa cửa hàng" : "Thêm cửa hàng"}</DialogTitle>
            <DialogDescription>
              Thông tin cửa hàng sẽ hiển thị trên trang chủ và ứng dụng mobile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Tên cửa hàng *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hotline">Hotline</Label>
                <Input
                  id="hotline"
                  value={form.hotline}
                  onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="open_hours">Giờ mở cửa</Label>
                <Input
                  id="open_hours"
                  placeholder="08:00 - 21:00"
                  value={form.open_hours}
                  onChange={(e) => setForm({ ...form, open_hours: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Thứ tự hiển thị</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-3">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Hiển thị công khai
                </Label>
              </div>
            </div>

            {/* Images */}
            <div>
              <Label>Hình ảnh cửa hàng (chọn 1 làm ảnh chính)</Label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.images.map((url) => {
                  const isMain = form.main_image === url;
                  return (
                    <div
                      key={url}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                        isMain ? "border-amber-500" : "border-hairline"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center hover:bg-rose-600"
                        aria-label="Xoá ảnh"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, main_image: url })}
                        className={`absolute bottom-1 left-1 inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                          isMain ? "bg-amber-500 text-white" : "bg-white/90 text-ink"
                        }`}
                      >
                        <Star className="w-3 h-3" /> {isMain ? "Ảnh chính" : "Đặt chính"}
                      </button>
                    </div>
                  );
                })}
                <label
                  className="aspect-square rounded-xl border-2 border-dashed border-hairline grid place-items-center cursor-pointer hover:border-brand-primary hover:bg-brand-soft/40"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => uploadFiles(e.target.files)}
                  />
                  <div className="text-center text-xs text-ink-muted">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mx-auto mb-1" />
                        Tải ảnh
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveMut.isPending}>
                {saveMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {form.id ? "Lưu thay đổi" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá cửa hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Cửa hàng "{deleteTarget?.name}" sẽ bị xoá vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
