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
  ImagePlus,
  X,
  Users,
  CalendarDays,
  Search,
} from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  EVENT_CATEGORIES,
  formatDateTime,
  isUpcoming,
  type EventMedia,
  type EventRegistration,
  type EventRow,
} from "@/lib/events";

export const Route = createFileRoute("/admin/events")({
  component: AdminEventsPage,
});

const BUCKET = "product-images";
const TTL = 60 * 60 * 24 * 365 * 10;

type FormState = {
  id: string | null;
  title: string;
  cover_url: string;
  content_rich: string;
  start_at: string;
  end_at: string;
  location: string;
  format: "online" | "offline";
  category: string;
  is_free: boolean;
  price: string;
  max_attendees: string;
};

const EMPTY: FormState = {
  id: null,
  title: "",
  cover_url: "",
  content_rich: "",
  start_at: "",
  end_at: "",
  location: "",
  format: "offline",
  category: EVENT_CATEGORIES[0],
  is_free: true,
  price: "",
  max_attendees: "",
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function uploadToBucket(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `events/${folder}/${crypto.randomUUID()}.${ext}`;
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

function AdminEventsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"info" | "album" | "regs">("info");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "upcoming" | "past"
  >("all");

  const listQ = useQuery({
    queryKey: ["admin", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const rows = listQ.data ?? [];
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filterCat !== "all" && r.category !== filterCat) return false;
        const up = isUpcoming(r);
        if (filterStatus === "upcoming" && !up) return false;
        if (filterStatus === "past" && up) return false;
        return true;
      }),
    [rows, filterCat, filterStatus],
  );

  const upsertM = useMutation({
    mutationFn: async (f: FormState) => {
      if (!f.title.trim()) throw new Error("Nhập tiêu đề");
      if (!f.start_at || !f.end_at) throw new Error("Chọn thời gian");
      const payload = {
        title: f.title.trim(),
        cover_url: f.cover_url.trim() || null,
        content_rich: f.content_rich || null,
        start_at: new Date(f.start_at).toISOString(),
        end_at: new Date(f.end_at).toISOString(),
        location: f.location.trim() || null,
        format: f.format,
        category: f.category || null,
        is_free: f.is_free,
        price: f.is_free ? null : Number(f.price) || null,
        max_attendees: f.max_attendees ? Number(f.max_attendees) : null,
      };
      if (f.id) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", f.id);
        if (error) throw error;
        return f.id;
      } else {
        const { data, error } = await supabase
          .from("events")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return data.id as string;
      }
    },
    onSuccess: (id) => {
      toast.success("Đã lưu sự kiện");
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      qc.invalidateQueries({ queryKey: ["public", "events"] });
      setForm((p) => ({ ...p, id }));
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      qc.invalidateQueries({ queryKey: ["public", "events"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const startCreate = () => {
    setForm(EMPTY);
    setTab("info");
    setOpen(true);
  };
  const startEdit = (r: EventRow) => {
    setForm({
      id: r.id,
      title: r.title,
      cover_url: r.cover_url ?? "",
      content_rich: r.content_rich ?? "",
      start_at: toLocalInput(r.start_at),
      end_at: toLocalInput(r.end_at),
      location: r.location ?? "",
      format: r.format,
      category: r.category ?? EVENT_CATEGORIES[0],
      is_free: r.is_free,
      price: r.price != null ? String(r.price) : "",
      max_attendees: r.max_attendees != null ? String(r.max_attendees) : "",
    });
    setTab("info");
    setOpen(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý Sự kiện</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tạo và điều phối các sự kiện Spa &amp; Clinic của VITA.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 h-10 font-semibold hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Sự kiện mới
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-sm bg-white"
        >
          <option value="all">Tất cả danh mục</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
          {(
            [
              ["all", "Tất cả"],
              ["upcoming", "Sắp tổ chức"],
              ["past", "Đã diễn ra"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterStatus(v)}
              className={`px-3 h-9 font-semibold ${
                filterStatus === v
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {listQ.isLoading ? (
          <div className="p-10 text-center text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Chưa có sự kiện nào
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 w-24">Ảnh</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3 w-44">Thời gian</th>
                <th className="px-4 py-3 w-40">Danh mục</th>
                <th className="px-4 py-3 w-32">Trạng thái</th>
                <th className="px-4 py-3 w-32 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const up = isUpcoming(r);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 last:border-none hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {r.cover_url ? (
                        <img
                          src={r.cover_url}
                          alt=""
                          className="h-12 w-20 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-20 rounded-md bg-gray-100 border border-gray-200" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 line-clamp-2">
                        {r.title}
                      </div>
                      {r.location && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {r.location}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formatDateTime(r.start_at)}
                      </div>
                      <div className="text-gray-400">
                        → {formatDateTime(r.end_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.category ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          up
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {up ? "Sắp tổ chức" : "Đã diễn ra"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Xoá sự kiện này?"))
                            deleteM.mutate(r.id);
                        }}
                        className="ml-1 inline-flex items-center gap-1 rounded-md border border-red-200 text-red-600 px-2 py-1 text-xs hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <EventDrawer
          form={form}
          setForm={setForm}
          tab={tab}
          setTab={setTab}
          onClose={() => {
            setOpen(false);
            setForm(EMPTY);
          }}
          onSave={() => upsertM.mutate(form)}
          saving={upsertM.isPending}
        />
      )}
    </div>
  );
}

function EventDrawer({
  form,
  setForm,
  tab,
  setTab,
  onClose,
  onSave,
  saving,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  tab: "info" | "album" | "regs";
  setTab: (t: "info" | "album" | "regs") => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const eventEnded =
    form.end_at !== "" && new Date(form.end_at).getTime() < Date.now();

  const onCover = async (f: File | null) => {
    if (!f) return;
    setUploadingCover(true);
    try {
      const url = await uploadToBucket(f, "covers");
      setForm((p) => ({ ...p, cover_url: url }));
      toast.success("Đã tải ảnh bìa");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[900px] max-h-[90vh] bg-white rounded-2xl overflow-y-auto flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {form.id ? "Chỉnh sửa sự kiện" : "Tạo sự kiện mới"}
            </h2>
            <div className="mt-2 flex gap-1">
              {(
                [
                  ["info", "Thông tin"],
                  ["album", "Album khoảnh khắc"],
                  ["regs", "Người đăng ký"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  disabled={v !== "info" && !form.id}
                  className={`px-3 h-8 rounded-full text-xs font-semibold ${
                    tab === v
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 grid place-items-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5">
          {tab === "info" && (
            <div className="space-y-4">
              <Field label="Tiêu đề *">
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </Field>

              <Field label="Ảnh bìa">
                <div className="flex items-start gap-3">
                  {form.cover_url ? (
                    <img
                      src={form.cover_url}
                      alt=""
                      className="w-40 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-40 h-24 rounded-lg bg-gray-50 border border-dashed border-gray-300 grid place-items-center text-gray-400">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={coverRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onCover(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => coverRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 h-9 text-sm hover:bg-gray-50"
                      disabled={uploadingCover}
                    >
                      {uploadingCover ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Tải ảnh bìa
                    </button>
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Bắt đầu *">
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.start_at}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, start_at: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Kết thúc *">
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.end_at}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, end_at: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Hình thức">
                  <select
                    className="input"
                    value={form.format}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        format: e.target.value as "online" | "offline",
                      }))
                    }
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </Field>
                <Field label="Danh mục">
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Địa điểm">
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                />
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input
                    type="checkbox"
                    checked={form.is_free}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, is_free: e.target.checked }))
                    }
                  />
                  Miễn phí
                </label>
                <Field label="Giá vé (VND)">
                  <input
                    className="input"
                    type="number"
                    disabled={form.is_free}
                    value={form.price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, price: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Số lượng tối đa">
                  <input
                    className="input"
                    type="number"
                    value={form.max_attendees}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        max_attendees: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <Field label="Nội dung chi tiết">
                <RichTextEditor
                  value={form.content_rich}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, content_rich: v }))
                  }
                  placeholder="Mô tả sự kiện, chương trình, quyền lợi khách mời..."
                  minHeight={240}
                />
              </Field>
            </div>
          )}

          {tab === "album" && form.id && (
            <AlbumTab eventId={form.id} unlocked={eventEnded} />
          )}
          {tab === "regs" && form.id && <RegsTab eventId={form.id} />}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 h-10 text-sm font-semibold hover:bg-gray-50"
          >
            Đóng
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-5 h-10 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.id ? "Cập nhật" : "Tạo sự kiện"}
          </button>
        </div>
      </div>
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
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </span>
      {children}
      <style>{`
        .input {
          width: 100%;
          height: 40px;
          border: 1px solid rgb(229 231 235);
          border-radius: 10px;
          padding: 0 12px;
          font-size: 14px;
          background: white;
        }
        .input:focus { outline: 2px solid rgb(16 185 129); outline-offset: -1px; }
      `}</style>
    </label>
  );
}

function AlbumTab({
  eventId,
  unlocked,
}: {
  eventId: string;
  unlocked: boolean;
}) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mediaQ = useQuery({
    queryKey: ["admin", "event_media", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_media")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventMedia[];
    },
  });

  const addM = useMutation({
    mutationFn: async (files: FileList) => {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const url = await uploadToBucket(file, `album/${eventId}`);
          const type: "image" | "video" = file.type.startsWith("video")
            ? "video"
            : "image";
          return { event_id: eventId, media_url: url, media_type: type };
        }),
      );
      const { error } = await supabase.from("event_media").insert(uploads);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã tải lên");
      qc.invalidateQueries({ queryKey: ["admin", "event_media", eventId] });
      qc.invalidateQueries({ queryKey: ["public", "event_media", eventId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const delM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_media")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "event_media", eventId] });
      qc.invalidateQueries({ queryKey: ["public", "event_media", eventId] });
    },
  });

  if (!unlocked) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-800">
        Album chỉ mở khoá sau khi sự kiện <b>đã kết thúc</b>. Vui lòng cập nhật
        thời gian kết thúc trước khi tải ảnh/video khoảnh khắc.
      </div>
    );
  }

  const items = mediaQ.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          Tải lên nhiều ảnh/video khoảnh khắc đáng giá của sự kiện.
        </p>
        <div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={async (e) => {
              const fs = e.target.files;
              if (!fs || fs.length === 0) return;
              setUploading(true);
              try {
                await addM.mutateAsync(fs);
              } finally {
                setUploading(false);
                if (fileRef.current) fileRef.current.value = "";
              }
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 h-9 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Tải lên
          </button>
        </div>
      </div>
      {mediaQ.isLoading ? (
        <div className="p-10 text-center text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-gray-500 border border-dashed rounded-xl">
          Chưa có ảnh/video
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square"
            >
              {m.media_type === "video" ? (
                <video
                  src={m.media_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={m.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={() => {
                  if (confirm("Xoá?")) delM.mutate(m.id);
                }}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-red-600 grid place-items-center opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegsTab({ eventId }: { eventId: string }) {
  const regQ = useQuery({
    queryKey: ["admin", "event_regs", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventRegistration[];
    },
  });

  if (regQ.isLoading)
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  const rows = regQ.data ?? [];
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-emerald-600" />
        <b>{rows.length}</b> người đã đăng ký
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Chưa có đăng ký</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Họ tên</th>
              <th className="px-4 py-2">SĐT</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{r.full_name}</td>
                <td className="px-4 py-2">{r.phone}</td>
                <td className="px-4 py-2 text-gray-600">{r.email ?? "—"}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  {formatDateTime(r.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
