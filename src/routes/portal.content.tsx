import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PenSquare, Video } from "lucide-react";

export const Route = createFileRoute("/portal/content")({
  component: ContentPage,
});

function ContentPage() {
  const { email, fullName } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const me = useQuery({
    queryKey: ["portal", "me", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; full_name: string | null } | null;
    },
  });
  const authorId = me.data?.id ?? null;

  const myPosts = useQuery({
    queryKey: ["portal", "my-posts", authorId],
    enabled: !!authorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, status, created_at, video_url")
        .eq("author_id", authorId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!authorId) throw new Error("Tài khoản chưa liên kết với bảng nhân viên");
      if (!title.trim()) throw new Error("Vui lòng nhập tiêu đề");
      const { error } = await supabase.from("posts").insert({
        title: title.trim(),
        content: content.trim() || null,
        video_url: videoUrl.trim() || null,
        author_id: authorId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã gửi bài chờ Quản lý duyệt");
      setTitle("");
      setContent("");
      setVideoUrl("");
      qc.invalidateQueries({ queryKey: ["portal", "my-posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <div className="mx-auto max-w-[1180px] grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-white border border-hairline rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-1">
          <PenSquare className="w-6 h-6 text-brand-dark" />
          <h1 className="text-2xl font-black text-brand-dark">Viết bài mới</h1>
        </div>
        <p className="text-ink-muted font-medium mb-6">
          Chia sẻ nội dung, video TikTok/Shorts để Quản lý duyệt và đăng lên website.
        </p>

        {!authorId && me.isFetched && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3">
            Tài khoản <b>{email}</b> chưa được liên kết trong bảng nhân viên. Vui lòng liên hệ Quản lý.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề bài viết *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Trải nghiệm liệu trình XYZ tại spa..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả chi tiết, cảm nhận, hướng dẫn..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video" className="flex items-center gap-1.5">
              <Video className="w-4 h-4" /> Link Video TikTok / Shorts
            </Label>
            <Input
              id="video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@... hoặc https://youtube.com/shorts/..."
            />
            <p className="text-xs text-ink-muted">Dán URL công khai. Trường này sẽ lưu vào cột <code>video_url</code>.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={create.isPending || !authorId}
              className="bg-brand-dark hover:bg-brand-dark/90 text-white font-bold"
            >
              {create.isPending ? "Đang gửi..." : "Gửi duyệt"}
            </Button>
            <span className="text-xs text-ink-muted">Bài sẽ ở trạng thái <b>pending</b> cho đến khi Quản lý duyệt.</span>
          </div>
        </form>
      </div>

      <aside className="bg-white border border-hairline rounded-2xl p-6 h-fit">
        <h2 className="text-lg font-black text-brand-dark mb-3">Bài của tôi</h2>
        <p className="text-xs text-ink-muted mb-4">{fullName ?? email}</p>
        {myPosts.isLoading && <p className="text-sm text-ink-muted">Đang tải...</p>}
        {myPosts.data?.length === 0 && <p className="text-sm text-ink-muted">Bạn chưa gửi bài nào.</p>}
        <ul className="space-y-2">
          {myPosts.data?.map((p: { id: string; title: string | null; status: string | null; created_at: string | null }) => (
            <li key={p.id} className="rounded-lg border border-hairline p-3">
              <div className="font-bold text-sm text-brand-dark line-clamp-2">{p.title}</div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-ink-muted">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString("vi-VN") : ""}
                </span>
                <StatusBadge status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  if (s === "approved" || s === "hiển thị" || s === "published") {
    return <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-bold">Đã duyệt</span>;
  }
  if (s === "rejected") {
    return <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 font-bold">Từ chối</span>;
  }
  return <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-bold">Chờ duyệt</span>;
}
