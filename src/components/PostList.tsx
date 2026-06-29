import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const fallbackImg =
  "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png";

type Post = {
  id: string;
  category: string | null;
  title: string;
  summary: string | null;
  image: string | null;
  created_at: string;
};

export function PostList({
  title,
  description,
  category,
}: {
  title: string;
  description?: string;
  category?: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase
      .from("posts")
      .select("*")
      .eq("status", "Hiển thị")
      .order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    q.then(({ data }) => {
      setPosts((data as Post[]) ?? []);
      setLoading(false);
    });
  }, [category]);

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1180px] px-5">
        <h1 className="text-3xl lg:text-[34px] font-black tracking-tight text-brand-dark">
          {title}
        </h1>
        {description && (
          <p className="text-ink-muted mt-2 max-w-[620px]">{description}</p>
        )}
        <div className="mt-8">
          {loading ? (
            <p className="text-ink-muted">Đang tải...</p>
          ) : posts.length === 0 ? (
            <p className="text-ink-muted">Chưa có bài viết.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-[22px] bg-white border border-hairline shadow-[0_8px_24px_rgba(21,89,42,0.06)]"
                >
                  <div className="aspect-[16/10] overflow-hidden border-b border-hairline">
                    <img
                      src={p.image || fallbackImg}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <span className="inline-flex rounded-full bg-brand-soft text-brand-dark px-2.5 py-1 text-xs font-extrabold mb-2">
                      {p.category || "Tin tức"}
                    </span>
                    <h3 className="text-[17px] font-bold leading-snug">{p.title}</h3>
                    <p className="text-sm text-ink-muted mt-2 line-clamp-3">{p.summary}</p>
                    <small className="block mt-3 text-ink-muted text-xs">
                      {new Date(p.created_at).toLocaleDateString("vi-VN")}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
