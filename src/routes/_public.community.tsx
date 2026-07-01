import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock, Search } from "lucide-react";

export const Route = createFileRoute("/_public/community")({
  head: () => ({
    meta: [
      { title: "Cộng đồng VITA — Tin tức & Sự kiện" },
      {
        name: "description",
        content:
          "Dòng thời gian tổng hợp tin tức và sự kiện của Cộng đồng VITA Spa & Clinic.",
      },
    ],
  }),
  component: CommunityPage,
});

type FeedItem = {
  id: string;
  title: string;
  cover_url: string | null;
  category: string | null;
  summary: string | null;
  created_at: string;
  post_type: "event" | "news";
  start_at: string | null;
  end_at: string | null;
};

function CommunityPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "event" | "news">("all");

  const feedQ = useQuery({
    queryKey: ["community_feed", "full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_feed" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as FeedItem[];
    },
  });

  const items = feedQ.data ?? [];
  const filtered = useMemo(
    () =>
      items.filter((it) => {
        if (filter !== "all" && it.post_type !== filter) return false;
        if (
          q.trim() &&
          !it.title.toLowerCase().includes(q.trim().toLowerCase())
        )
          return false;
        return true;
      }),
    [items, filter, q],
  );

  return (
    <div className="bg-[#fafaf7] min-h-screen">
      {/* Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5efe4] via-[#faf6ec] to-[#eef7ea]" />
        <div className="relative max-w-[1180px] mx-auto px-4 md:px-6 py-14 md:py-20 text-center">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.35em] text-amber-700">
            Vita Community
          </p>
          <h1 className="mt-3 font-heading text-4xl md:text-6xl font-black tracking-tight text-gray-900">
            CỘNG ĐỒNG VITA
          </h1>
          <p className="mt-4 max-w-[640px] mx-auto text-sm md:text-base text-gray-600 leading-relaxed">
            Dòng thời gian hội tụ tin tức chuyên sâu và các sự kiện đẳng cấp của
            hệ sinh thái VITA Spa &amp; Clinic — cập nhật realtime.
          </p>
        </div>
      </section>

      {/* Controls */}
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 -mt-6 md:-mt-8 relative z-10">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-[#fafaf7] rounded-full h-11 px-4 border border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm bài viết, sự kiện..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="inline-flex rounded-full bg-[#fafaf7] p-1 border border-gray-100">
            {(
              [
                ["all", "Tất cả"],
                ["event", "Sự kiện"],
                ["news", "Tin tức"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-4 h-9 rounded-full text-xs font-semibold transition-colors ${
                  filter === v
                    ? "bg-gray-900 text-white shadow"
                    : "text-gray-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <section className="max-w-[820px] mx-auto px-4 md:px-6 py-10 md:py-14">
        {feedQ.isLoading ? (
          <p className="text-center text-gray-500">Đang tải cộng đồng...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-500">
            Chưa có bài viết phù hợp
          </div>
        ) : (
          <ol className="space-y-6">
            {filtered.map((it) => (
              <li key={`${it.post_type}-${it.id}`}>
                <TimelineCard item={it} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function TimelineCard({ item }: { item: FeedItem }) {
  const isEvent = item.post_type === "event";
  const to = isEvent ? "/events/$id" : "/news/$id";
  const dateLabel = isEvent && item.start_at
    ? new Date(item.start_at).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(item.created_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
      <div className="grid md:grid-cols-[280px_1fr]">
        <Link
          to={to}
          params={{ id: item.id }}
          className="block aspect-[16/10] md:aspect-auto md:h-full overflow-hidden bg-gray-100"
        >
          {item.cover_url ? (
            <img
              src={item.cover_url}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 via-white to-emerald-100" />
          )}
        </Link>
        <div className="p-5 md:p-6 flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            {isEvent ? (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm">
                Sự kiện
              </span>
            ) : (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                {item.category ?? "Tin tức"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
              {isEvent ? (
                <CalendarDays className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {dateLabel}
            </span>
          </div>

          <Link to={to} params={{ id: item.id }}>
            <h2 className="mt-3 font-heading text-xl md:text-2xl font-black text-gray-900 leading-snug tracking-tight group-hover:text-emerald-700 transition-colors">
              {item.title}
            </h2>
          </Link>

          {item.summary && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {item.summary}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center gap-3">
            <Link
              to={to}
              params={{ id: item.id }}
              className={`inline-flex items-center h-9 px-4 rounded-full text-xs font-bold text-white shadow-sm ${
                isEvent
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isEvent
                ? isFuture(item.start_at)
                  ? "Đăng ký tham gia"
                  : "Xem khoảnh khắc"
                : "Đọc bài viết"}
            </Link>
            <span className="text-[11px] text-gray-400">
              {isEvent ? "Sự kiện Vita" : "Đọc trong ~3 phút"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}
