import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/posts")({
  component: PostsAdmin,
});

type Post = {
  id: string;
  category: string | null;
  title: string | null;
  summary: string | null;
  image: string | null;
  status: string | null;
  created_at: string | null;
};

const CATEGORIES = ["Tin tức", "Sự kiện", "Đào tạo"];
const STATUSES = ["Hiển thị", "Ẩn"];

type FormState = {
  title: string;
  category: string;
  image: string;
  summary: string;
  status: string;
};

const EMPTY: FormState = {
  title: "",
  category: "Tin tức",
  image: "",
  summary: "",
  status: "Hiển thị",
};

function PostsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [catFilter, setCatFilter] = useState("all");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const filtered = catFilter === "all" ? rows : rows.filter((r) => (r.category ?? "") === catFilter);


  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Vui lòng nhập tiêu đề");
      const payload = {
        title: form.title.trim(),
        category: form.category,
        image: form.image.trim() || null,
        summary: form.summary.trim() || null,
        status: form.status,
      };
      if (editingId) {
        const { error } = await supabase.from("posts").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Đã cập nhật bài viết" : "Đã thêm bài viết");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      setOpen(false);
      setEditingId(null);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message || "Lưu thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá bài viết");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
    onError: (e: Error) => toast.error(e.message || "Xoá thất bại"),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (p: Post) => {
    setEditingId(p.id);
    setForm({
      title: p.title ?? "",
      category: p.category ?? "Tin tức",
      image: p.image ?? "",
      summary: p.summary ?? "",
      status: p.status ?? "Hiển thị",
    });
    setOpen(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <>
      <AdminTopbar
        title="Tin tức / Hoạt động / Đào tạo"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${rows.length} bài viết`}
        right={<Button onClick={openCreate}>+ Thêm bài viết</Button>}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {(error as Error).message}
        </div>
      )}

      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Lọc theo phân loại</Label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              {["Ảnh", "Tiêu đề", "Phân loại", "Trạng thái", "Ngày tạo", "Thao tác"].map((h) => (
                <th
                  key={h}
                  className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted font-semibold">
                  Chưa có dữ liệu, vui lòng bấm nút{" "}
                  <span className="text-brand-dark">Thêm bài viết</span>.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (

                <tr key={p.id}>
                  <td className="px-3.5 py-3 border-b border-[#edf3ed]">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title ?? ""}
                        className="h-12 w-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-md bg-slate-100" />
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold max-w-[360px]">
                    {p.title}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{p.category}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === "Hiển thị"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {p.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("vi-VN") : "-"}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(p)}>
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Xoá bài viết này?")) deleteMutation.mutate(p.id);
                        }}
                      >
                        Xoá
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh sửa bài viết" : "Thêm bài viết"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Tiêu đề <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phân loại</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Hình ảnh (URL)</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://..."
                value={form.image}
                onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Mô tả ngắn</Label>
              <Textarea
                id="summary"
                rows={4}
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
