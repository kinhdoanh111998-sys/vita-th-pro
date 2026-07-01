import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, CalendarDays } from "lucide-react";
import { NEWS_CATEGORIES, formatNewsDate, type NewsRow } from "@/lib/news";

export const Route = createFileRoute("/app/news")({ component: AppNewsList });

function AppNewsList() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const newsQ = useQuery({
    queryKey: ["public", "news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as NewsRow[];
    },
  });

  const rows = newsQ.data ?? [];
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (cat !== "all" && r.category !== cat) return false;
        if (q.trim() && !r.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [rows, cat, q],
  );

  return (
    <div className="pb-6">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-black text-brand-dark">Tin tức VITA</h1>
        <p className="text-xs text-gray-500 mt-1">
          Kiến thức chăm sóc da & ưu đãi độc quyền
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm bài viết..."
            className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 bg-white text-sm"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[["all", "Tất cả"], ...NEWS_CATEGORIES.map((c) => [c, c] as const)].map(
            ([v, l]) => (
              <button
                key={v}
                onClick={() => setCat(v)}
                className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold border ${
                  cat === v
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {l}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {newsQ.isLoading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có bài viết.</p>
        ) : (
          filtered.map((n) => (
            <Link
              key={n.id}
              to="/app/news/$id"
              params={{ id: n.id }}
              className="flex gap-3 rounded-2xl bg-white border border-gray-100 p-3 shadow-sm"
            >
              <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                {n.cover_url && (
                  <img src={n.cover_url} alt={n.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                  {n.category}
                </span>
                <h3 className="mt-1 text-sm font-bold text-brand-dark line-clamp-2 leading-snug">
                  {n.title}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                  <CalendarDays className="w-3 h-3" />
                  {formatNewsDate(n.published_at ?? n.created_at)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
