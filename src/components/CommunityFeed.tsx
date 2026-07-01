import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";

export type FeedItem = {
  id: string;
  title: string;
  cover_url: string | null;
  category: string | null;
  created_at: string;
  post_type: "event" | "news";
};

function useCommunityFeed(limit = 8) {
  return useQuery({
    queryKey: ["community_feed", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_feed" as any)
        .select("id,title,cover_url,category,created_at,post_type")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as FeedItem[];
    },
  });
}

function Badge({ item }: { item: FeedItem }) {
  if (item.post_type === "event") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200">
        Sự kiện
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
      {item.category ?? "Tin tức"}
    </span>
  );
}

function itemLink(item: FeedItem) {
  return item.post_type === "event"
    ? { to: "/events/$id" as const, params: { id: item.id } }
    : { to: "/news/$id" as const, params: { id: item.id } };
}

function FeedCard({ item }: { item: FeedItem }) {
  const link = itemLink(item);
  return (
    <Link
      {...link}
      className="group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-amber-50" />
        )}
        <div className="absolute top-2 left-2">
          <Badge item={item} />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-heading font-bold text-sm md:text-base text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
          {item.title}
        </h3>
        <p className="mt-1 text-[11px] text-gray-400">
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </p>
      </div>
    </Link>
  );
}

export function CommunityFeedPC() {
  const { data = [], isLoading } = useCommunityFeed(9);
  return (
    <section id="community" className="pt-10 md:pt-14 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between mb-5 px-4 md:px-8">
        <div>
          <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Cộng đồng Vita
          </p>
          <h2 className="text-lg md:text-2xl font-heading font-bold text-gray-900 mt-0.5">
            Feed Cộng đồng
          </h2>
        </div>
        <Link
          to="/news"
          className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5 font-semibold"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {isLoading ? (
        <div className="px-4 md:px-8 text-sm text-gray-500">Đang tải…</div>
      ) : data.length === 0 ? (
        <div className="px-4 md:px-8 text-sm text-gray-500">Chưa có bài viết.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-4 md:px-8">
          {data.map((it) => (
            <FeedCard key={`${it.post_type}-${it.id}`} item={it} />
          ))}
        </div>
      )}
    </section>
  );
}

export function CommunityFeedMobile() {
  const { data = [], isLoading } = useCommunityFeed(10);
  return (
    <section className="pt-2">
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="font-heading text-base font-bold text-gray-900">Cộng đồng Vita</h2>
        <Link to="/news" className="text-xs text-brand-primary font-semibold">
          Xem tất cả
        </Link>
      </div>
      {isLoading ? (
        <div className="px-4 text-sm text-gray-500">Đang tải…</div>
      ) : data.length === 0 ? (
        <div className="px-4 text-sm text-gray-500">Chưa có bài viết.</div>
      ) : (
        <div className="px-4 pb-2 flex flex-row gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {data.map((it) => (
            <div key={`${it.post_type}-${it.id}`} className="shrink-0 w-52 snap-start">
              <FeedCard item={it} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
