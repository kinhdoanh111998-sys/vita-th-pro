import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin/banners")({
  component: AdminBannersPage,
});

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  type: string | null;
  cta: string | null;
  image: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type FormState = {
  id: string | null;
  title: string;
  subtitle: string;
  cta: string;
  link_url: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY: FormState = {
  id: null,
  title: "",
  subtitle: "",
  cta: "",
  link_url: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

const BUCKET = "product-images";
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

function AdminBannersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const listQ = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const rows = listQ.data ?? [];

  const upsertM = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        title: f.title.trim(),
        subtitle: f.subtitle.trim() || null,
        cta: f.cta.trim() || null,
        link_url: f.link_url.trim() || null,
        image_url: f.image_url.trim() || null,
        image: f.image_url.trim() || null, // legacy sync
        sort_order: Number(f.sort_order) || 0,
        is_active: f.is_active,
      };
      if (f.id) {
        const { error } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu banner");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["public", "banners"] });
      setOpen(false);
      setForm(EMPTY);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const patchM = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<Banner> }) => {
      const { error } = await supabase
        .from("banners")
        .update(p.patch)
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["public", "banners"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["public", "banners"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `banners/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);
      if (error) throw error;
      setForm((p) => ({ ...p, image_url: data.signedUrl }));
      toast.success("Đã tải ảnh lên");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const move = (row: Banner, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const swapWith = rows[idx + dir];
    if (!swapWith) return;
    patchM.mutate({
      id: row.id,
      patch: { sort_order: swapWith.sort_order },
    });
    patchM.mutate({
      id: swapWith.id,
      patch: { sort_order: row.sort_order },
    });
  };

  const startCreate = () => {
    const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
    setForm({ ...EMPTY, sort_order: maxSort + 1 });
    setOpen(true);
  };

  const startEdit = (b: Banner) => {
    setForm({
      id: b.id,
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      cta: b.cta ?? "",
      link_url: b.link_url ?? "",
      image_url: b.image_url ?? b.image ?? "",
      sort_order: b.sort_order ?? 0,
      is_active: b.is_active ?? true,
    });
    setOpen(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Banner</h1>
          <p className="text-sm text-gray-500 mt-1">
            Banner sẽ hiển thị dạng Slider trên trang chủ theo thứ tự sắp xếp.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 h-10 font-semibold hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Thêm banner
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {listQ.isLoading ? (
          <div className="p-10 text-center text-gray-500">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Chưa có banner nào</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 w-20">STT</th>
                <th className="px-4 py-3 w-32">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Liên kết</th>
                <th className="px-4 py-3 w-24 text-center">Hiển thị</th>
                <th className="px-4 py-3 w-40 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => (
                <tr
                  key={b.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold w-6">{b.sort_order}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(b, -1)}
                          disabled={i === 0}
                          className="p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30"
                          aria-label="Lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => move(b, 1)}
                          disabled={i === rows.length - 1}
                          className="p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30"
                          aria-label="Xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {b.image_url || b.image ? (
                      <img
                        src={b.image_url ?? b.image ?? ""}
                        alt=""
                        className="h-14 w-24 object-cover rounded-md border border-gray-200"
                      />
                    ) : (
                      <div className="h-14 w-24 rounded-md bg-gray-100 border border-gray-200" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{b.title}</div>
                    {b.subtitle && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {b.subtitle}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.link_url ? (
                      <a
                        href={b.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-[220px]">{b.link_url}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        patchM.mutate({
                          id: b.id,
                          patch: { is_active: !b.is_active },
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        b.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.is_active ? (
                        <>
                          <Eye className="w-3 h-3" /> Hiện
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Ẩn
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => startEdit(b)}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        aria-label="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Xoá banner "${b.title}"?`))
                            deleteM.mutate(b.id);
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {form.id ? "Sửa banner" : "Thêm banner mới"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <Field label="Tiêu đề *">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="input"
                  placeholder="VD: Khai trương chi nhánh VITA Q1"
                />
              </Field>
              <Field label="Mô tả ngắn">
                <textarea
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subtitle: e.target.value }))
                  }
                  rows={2}
                  className="input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nút hành động (CTA)">
                  <input
                    value={form.cta}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, cta: e.target.value }))
                    }
                    className="input"
                    placeholder="Đặt lịch ngay"
                  />
                </Field>
                <Field label="Đường dẫn khi bấm banner">
                  <input
                    value={form.link_url}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, link_url: e.target.value }))
                    }
                    className="input"
                    placeholder="/booking hoặc https://..."
                  />
                </Field>
              </div>

              <Field label="Ảnh banner (khuyến nghị 1920×720)">
                <div className="flex gap-3">
                  <div className="w-48 h-28 rounded-lg border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {form.image_url ? (
                      <img
                        src={form.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Chưa có ảnh</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-semibold"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Tải ảnh lên
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f);
                        e.target.value = "";
                      }}
                    />
                    <input
                      value={form.image_url}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, image_url: e.target.value }))
                      }
                      className="input text-xs"
                      placeholder="Hoặc dán URL ảnh"
                    />
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Thứ tự hiển thị">
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        sort_order: Number(e.target.value) || 0,
                      }))
                    }
                    className="input"
                  />
                </Field>
                <Field label="Trạng thái">
                  <label className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, is_active: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Hiển thị banner này</span>
                  </label>
                </Field>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 h-10 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  if (!form.title.trim()) {
                    toast.error("Vui lòng nhập tiêu đề");
                    return;
                  }
                  upsertM.mutate(form);
                }}
                disabled={upsertM.isPending}
                className="px-5 h-10 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {upsertM.isPending ? "Đang lưu..." : form.id ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;height:40px;padding:0 12px;border:1px solid #E3E3E3;border-radius:8px;font-size:14px;outline:none;background:white}.input:focus{border-color:#1B9606;box-shadow:0 0 0 3px rgba(27,150,6,0.1)}textarea.input{height:auto;padding:10px 12px;font-family:inherit}`}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
