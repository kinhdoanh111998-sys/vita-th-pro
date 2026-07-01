import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Search } from "lucide-react";
import { NEWS_CATEGORIES, formatNewsDate, type NewsRow } from "@/lib/news";

export const Route = createFileRoute("/_public/news/")({ component: NewsListPage });

function NewsListPage() {
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

  const filtered = useMemo(() => {
    const rows = newsQ.data ?? [];
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (q.trim() && !r.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [newsQ.data, cat, q]);

  const featured = filtered.find((r) => r.is_featured) ?? filtered[0];
  const rest = featured ? filtered.filter((r) => r.id !== featured.id) : filtered;

  return (
    <section className="py-12 bg-[#fafaf7] min-h-screen">
      <div className="mx-auto max-w-[1180px] px-5">
        <h1 className="text-3xl lg:text-[38px] font-black tracking-tight text-brand-dark">
          Kiến thức & Tin tức VITA
        </h1>
        <p className="text-ink-muted mt-2 max-w-[620px]">
          Cẩm nang chăm sóc da, dịch vụ trị liệu chuyên sâu và ưu đãi độc quyền dành cho khách hàng thân thiết.
        </p>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full h-11 pl-10 pr-4 rounded-full border border-gray-200 bg-white text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[["all", "Tất cả"], ...NEWS_CATEGORIES.map((c) => [c, c] as const)].map(
              ([v, l]) => (
                <button
                  key={v}
                  onClick={() => setCat(v)}
                  className={`px-4 h-9 rounded-full text-sm font-semibold border ${
                    cat === v
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  {l}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {newsQ.isLoading ? (
            <p className="text-ink-muted">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="text-ink-muted">Chưa có bài viết phù hợp.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {featured && (
                <FeaturedCard news={featured} />
              )}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {rest.slice(0, 4).map((n) => (
                  <SmallCard key={n.id} news={n} />
                ))}
              </div>
              {rest.slice(4).length > 0 && (
                <div className="lg:col-span-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-2">
                  {rest.slice(4).map((n) => (
                    <StdCard key={n.id} news={n} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ news }: { news: NewsRow }) {
  return (
    <Link
      to="/news/$id"
      params={{ id: news.id }}
      className="lg:col-span-2 group overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-[0_10px_30px_rgba(21,89,42,0.08)] hover:shadow-lg transition"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        {news.cover_url && (
          <img
            src={news.cover_url}
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          />
        )}
      </div>
      <div className="p-6">
        <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold">
          {news.category}
        </span>
        <h2 className="mt-3 text-2xl font-black text-brand-dark leading-tight group-hover:text-emerald-700">
          {news.title}
        </h2>
        {news.summary && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{news.summary}</p>
        )}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarDays className="w-3.5 h-3.5" />
          {formatNewsDate(news.published_at ?? news.created_at)}
        </div>
      </div>
    </Link>
  );
}

function SmallCard({ news }: { news: NewsRow }) {
  return (
    <Link
      to="/news/$id"
      params={{ id: news.id }}
      className="flex gap-3 rounded-2xl bg-white border border-gray-100 p-3 hover:shadow-md transition"
    >
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
        {news.cover_url && (
          <img src={news.cover_url} alt={news.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
          {news.category}
        </span>
        <h3 className="mt-1 text-sm font-bold text-brand-dark line-clamp-2 leading-snug">
          {news.title}
        </h3>
        <small className="mt-1 block text-xs text-gray-400">
          {formatNewsDate(news.published_at ?? news.created_at)}
        </small>
      </div>
    </Link>
  );
}

function StdCard({ news }: { news: NewsRow }) {
  return (
    <Link
      to="/news/$id"
      params={{ id: news.id }}
      className="group overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-md transition"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        {news.cover_url && (
          <img src={news.cover_url} alt={news.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
        )}
      </div>
      <div className="p-4">
        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
          {news.category}
        </span>
        <h3 className="mt-1 text-[15px] font-bold text-brand-dark leading-snug line-clamp-2">
          {news.title}
        </h3>
        <small className="mt-2 block text-xs text-gray-400">
          {formatNewsDate(news.published_at ?? news.created_at)}
        </small>
      </div>
    </Link>
  );
}
