import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, MessageCircle, Send, Loader2 } from "lucide-react";
import { formatNewsDate, type NewsComment, type NewsRow } from "@/lib/news";

type Props = {
  id: string;
  variant?: "desktop" | "mobile";
  backTo?: string;
};

export function NewsDetail({ id, variant = "desktop", backTo }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", contact_info: "", content: "" });

  const newsQ = useQuery({
    queryKey: ["public", "news", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as NewsRow | null;
    },
  });

  const commentsQ = useQuery({
    queryKey: ["public", "news", id, "comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_comments")
        .select("*")
        .eq("news_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NewsComment[];
    },
  });

  const submitM = useMutation({
    mutationFn: async () => {
      if (form.full_name.trim().length < 2) throw new Error("Vui lòng nhập họ tên");
      if (form.content.trim().length < 2) throw new Error("Vui lòng nhập nội dung bình luận");
      const { data: inserted, error } = await supabase.from("news_comments").insert({
        news_id: id,
        full_name: form.full_name.trim(),
        content: form.content.trim(),
        status: "pending",
      }).select("id").single();
      if (error) throw error;
      const contact = form.contact_info.trim();
      if (contact && inserted?.id) {
        // Lưu thông tin liên hệ vào bảng riêng chỉ admin/staff đọc được
        await supabase.from("news_comment_contacts").insert({
          comment_id: inserted.id,
          contact_info: contact,
        });
      }
    },
    onSuccess: () => {
      toast.success("Bình luận của bạn đã được gửi và đang chờ quản trị viên kiểm duyệt!");
      setForm({ full_name: "", contact_info: "", content: "" });
      qc.invalidateQueries({ queryKey: ["public", "news", id, "comments"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (newsQ.isLoading) return <div className="p-10 text-center text-gray-500">Đang tải...</div>;
  const n = newsQ.data;
  if (!n) return <div className="p-10 text-center text-gray-500">Không tìm thấy bài viết</div>;

  const isMobile = variant === "mobile";
  const wrap = isMobile ? "px-4 pb-10" : "max-w-[820px] mx-auto px-5 py-10";

  return (
    <div className={wrap}>
      {backTo && (
        <Link
          to={backTo as never}
          className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold mb-4 hover:underline"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại
        </Link>
      )}

      <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold">
        {n.category}
      </span>
      <h1 className={`mt-3 font-black text-brand-dark leading-tight ${isMobile ? "text-2xl" : "text-4xl"}`}>
        {n.title}
      </h1>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <CalendarDays className="w-3.5 h-3.5" />
        {formatNewsDate(n.published_at ?? n.created_at)}
      </div>

      {n.cover_url && (
        <img
          src={n.cover_url}
          alt={n.title}
          className="mt-5 w-full rounded-2xl border border-gray-100 object-cover"
        />
      )}

      {n.summary && (
        <p className="mt-5 text-[15px] text-gray-700 italic border-l-4 border-emerald-500 pl-4">
          {n.summary}
        </p>
      )}

      {n.content_rich && (
        <div
          className="prose prose-emerald max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: n.content_rich }}
        />
      )}

      {/* Comments */}
      <section className="mt-12 border-t border-gray-100 pt-8">
        <h2 className="flex items-center gap-2 text-xl font-black text-brand-dark">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          Bình luận ({commentsQ.data?.length ?? 0})
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitM.mutate();
          }}
          className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Họ và tên *"
              maxLength={100}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 h-11 text-sm"
              required
            />
            <input
              value={form.contact_info}
              onChange={(e) => setForm((p) => ({ ...p, contact_info: e.target.value }))}
              placeholder="Số điện thoại hoặc email"
              maxLength={120}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 h-11 text-sm"
            />
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Chia sẻ cảm nhận của bạn... *"
            maxLength={1000}
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitM.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-5 h-11 font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi bình luận
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          {commentsQ.isLoading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : (commentsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ!
            </p>
          ) : (
            commentsQ.data!.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <b className="text-sm text-brand-dark">{c.full_name}</b>
                  <small className="text-xs text-gray-400">
                    {formatNewsDate(c.created_at)}
                  </small>
                </div>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
