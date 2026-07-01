import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  X,
  MessageSquare,
  Check,
  EyeOff,
  Star,
  StarOff,
} from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  NEWS_CATEGORIES,
  formatNewsDate,
  type NewsComment,
  type NewsRow,
} from "@/lib/news";

export const Route = createFileRoute("/admin/news")({ component: AdminNewsPage });

const BUCKET = "product-images";
const TTL = 60 * 60 * 24 * 365 * 10;

type FormState = {
  id: string | null;
  title: string;
  cover_url: string;
  summary: string;
  content_rich: string;
  category: string;
  is_featured: boolean;
  published_at: string;
};

const EMPTY: FormState = {
  id: null,
  title: "",
  cover_url: "",
  summary: "",
  content_rich: "",
  category: NEWS_CATEGORIES[0],
  is_featured: false,
  published_at: "",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function uploadCover(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `news/covers/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TTL);
  if (sErr) throw sErr;
  return data.signedUrl;
}

function AdminNewsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [open, setOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");

  const listQ = useQuery({
    queryKey: ["admin", "news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as NewsRow[];
    },
  });

  const rows = listQ.data ?? [];
  const filtered = useMemo(
    () => rows.filter((r) => (filterCat === "all" ? true : r.category === filterCat)),
    [rows, filterCat],
  );

  const pendingCountQ = useQuery({
    queryKey: ["admin", "comments", "pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("news_comments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const upsertM = useMutation({
    mutationFn: async (f: FormState) => {
      if (!f.title.trim()) throw new Error("Nhập tiêu đề");
      const payload = {
        title: f.title.trim(),
        cover_url: f.cover_url.trim() || null,
        summary: f.summary.trim() || null,
        content_rich: f.content_rich || null,
        category: f.category,
        is_featured: f.is_featured,
        published_at: f.published_at ? new Date(f.published_at).toISOString() : new Date().toISOString(),
      };
      if (f.id) {
        const { error } = await supabase.from("news").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu bài viết");
      qc.invalidateQueries({ queryKey: ["admin", "news"] });
      qc.invalidateQueries({ queryKey: ["public", "news"] });
      setOpen(false);
      setForm(EMPTY);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["admin", "news"] });
      qc.invalidateQueries({ queryKey: ["public", "news"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleFeaturedM = useMutation({
    mutationFn: async (r: NewsRow) => {
      const { error } = await supabase
        .from("news")
        .update({ is_featured: !r.is_featured })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "news"] }),
  });

  const startCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };
  const startEdit = (r: NewsRow) => {
    setForm({
      id: r.id,
      title: r.title,
      cover_url: r.cover_url ?? "",
      summary: r.summary ?? "",
      content_rich: r.content_rich ?? "",
      category: r.category ?? NEWS_CATEGORIES[0],
      is_featured: r.is_featured,
      published_at: toLocalInput(r.published_at),
    });
    setOpen(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Tin tức</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xuất bản bài viết & kiểm duyệt bình luận.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 h-10 font-semibold hover:bg-gray-50"
          >
            <MessageSquare className="w-4 h-4" /> Kiểm duyệt
            {(pendingCountQ.data ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5">
                {pendingCountQ.data}
              </span>
            )}
          </button>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 h-10 font-semibold hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Bài viết mới
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[["all", "Tất cả"], ...NEWS_CATEGORIES.map((c) => [c, c] as const)].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterCat(v)}
            className={`px-3 h-9 rounded-lg text-sm font-semibold border ${
              filterCat === v
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {listQ.isLoading ? (
          <div className="p-10 text-center text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Chưa có bài viết</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 w-20">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3 w-52">Danh mục</th>
                <th className="px-4 py-3 w-32">Xuất bản</th>
                <th className="px-4 py-3 w-40 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {r.cover_url ? (
                      <img src={r.cover_url} alt="" className="h-12 w-16 object-cover rounded-md border border-gray-200" />
                    ) : (
                      <div className="h-12 w-16 rounded-md bg-gray-100" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 line-clamp-2 flex items-center gap-1.5">
                      {r.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                      {r.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.category}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {r.published_at ? formatNewsDate(r.published_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => toggleFeaturedM.mutate(r)}
                      title={r.is_featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                      className="inline-flex items-center rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 mr-1"
                    >
                      {r.is_featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => startEdit(r)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Xoá bài viết này?")) deleteM.mutate(r.id);
                      }}
                      className="ml-1 inline-flex items-center gap-1 rounded-md border border-red-200 text-red-600 px-2 py-1 text-xs hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <NewsDrawer
          form={form}
          setForm={setForm}
          onClose={() => {
            setOpen(false);
            setForm(EMPTY);
          }}
          onSave={() => upsertM.mutate(form)}
          saving={upsertM.isPending}
        />
      )}

      {modOpen && <ModerationDrawer onClose={() => setModOpen(false)} />}
    </div>
  );
}

function NewsDrawer({
  form,
  setForm,
  onClose,
  onSave,
  saving,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const onCover = async (f: File | null) => {
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadCover(f);
      setForm((p) => ({ ...p, cover_url: url }));
      toast.success("Đã tải ảnh bìa");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-200 shrink-0">
          <h2 className="font-black text-gray-900">
            {form.id ? "Chỉnh sửa bài viết" : "Bài viết mới"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Tiêu đề *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-200 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Danh mục</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="mt-1 w-full h-11 px-3 rounded-lg border border-gray-200 text-sm bg-white"
            >
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              Thời gian xuất bản được tự động ghi nhận khi tạo hoặc chỉnh sửa bài viết.
            </p>
          </div>


          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="font-semibold">Đặt làm bài viết nổi bật</span>
          </label>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Ảnh bìa</label>
            <div className="mt-1 flex items-center gap-3">
              {form.cover_url && (
                <img src={form.cover_url} alt="" className="h-20 w-32 object-cover rounded-lg border border-gray-200" />
              )}
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 h-10 text-sm font-semibold hover:bg-gray-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {form.cover_url ? "Đổi ảnh" : "Tải lên"}
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onCover(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Tóm tắt</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              rows={2}
              maxLength={300}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase">Nội dung</label>
            <div className="mt-1">
              <RichTextEditor
                value={form.content_rich}
                onChange={(html) => setForm((p) => ({ ...p, content_rich: html }))}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 flex justify-end gap-2 px-5 h-16 border-t border-gray-200 bg-white items-center">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 h-10 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-5 h-10 font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.id ? "Cập nhật" : "Xuất bản"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModerationDrawer({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "hidden">("pending");

  const commentsQ = useQuery({
    queryKey: ["admin", "comments", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_comments")
        .select("*, news:news_id(title)")
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as (NewsComment & { news: { title: string } | null })[];
    },
  });

  const updateStatusM = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NewsComment["status"] }) => {
      const { error } = await supabase.from("news_comments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật");
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá bình luận");
      qc.invalidateQueries({ queryKey: ["admin", "comments"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-200 shrink-0">
          <h2 className="font-black text-gray-900">Kiểm duyệt bình luận</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 shrink-0">
          {(
            [
              ["pending", "Chờ duyệt"],
              ["approved", "Đã duyệt"],
              ["hidden", "Đã ẩn"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`flex-1 h-11 text-sm font-semibold ${
                tab === v
                  ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {commentsQ.isLoading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : (commentsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 italic">Không có bình luận</p>
          ) : (
            commentsQ.data!.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <b className="text-gray-900 text-sm">{c.full_name}</b>
                  <span>{formatNewsDate(c.created_at)}</span>
                </div>
                {c.contact_info && (
                  <div className="text-xs text-gray-500 mt-0.5">{c.contact_info}</div>
                )}
                {c.news?.title && (
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Bài: {c.news.title}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{c.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.status !== "approved" && (
                    <button
                      onClick={() => updateStatusM.mutate({ id: c.id, status: "approved" })}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700"
                    >
                      <Check className="w-3.5 h-3.5" /> Duyệt
                    </button>
                  )}
                  {c.status !== "hidden" && (
                    <button
                      onClick={() => updateStatusM.mutate({ id: c.id, status: "hidden" })}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-semibold hover:bg-gray-200"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Ẩn
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Xoá vĩnh viễn?")) deleteM.mutate(c.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
