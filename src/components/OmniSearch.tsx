import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  Package,
  Wrench,
  Newspaper,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type SearchType = "all" | "service" | "product" | "news" | "event";

const TYPE_LABELS: Record<SearchType, string> = {
  all: "Tất cả",
  service: "Dịch vụ",
  product: "Sản phẩm",
  news: "Tin tức",
  event: "Sự kiện",
};

type SearchResult = {
  id: string;
  title: string;
  kind: "service" | "product" | "news" | "event";
  route: string;
};

const ICON_BY_KIND: Record<SearchResult["kind"], typeof Package> = {
  service: Wrench,
  product: Package,
  news: Newspaper,
  event: CalendarDays,
};

export type OmniSearchProps = {
  onNavigate?: () => void;
  className?: string;
  inputClassName?: string;
  /** Render as a more prominent hero search bar */
  hero?: boolean;
};

export function OmniSearch({
  onNavigate,
  className = "",
  inputClassName = "",
  hero = false,
}: OmniSearchProps) {
  const [type, setType] = useState<SearchType>("all");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const enabled = debounced.length >= 2;
  const searchQ = useQuery({
    queryKey: ["omni-search", type, debounced],
    enabled,
    queryFn: async () => {
      const term = `%${debounced}%`;
      const results: SearchResult[] = [];

      const runServiceProduct = async (kind: "service" | "product") => {
        const { data } = await supabase
          .from("services")
          .select("id, name, type")
          .eq("type", kind)
          .ilike("name", term)
          .limit(5);
        (data ?? []).forEach((r) =>
          results.push({
            id: r.id,
            title: r.name,
            kind,
            route: `/${kind === "service" ? "services" : "products"}/${r.id}`,
          }),
        );
      };

      const runNews = async () => {
        const { data } = await supabase
          .from("news")
          .select("id, title")
          .ilike("title", term)
          .limit(5);
        (data ?? []).forEach((r) =>
          results.push({ id: r.id, title: r.title, kind: "news", route: `/news/${r.id}` }),
        );
      };

      const runEvents = async () => {
        const { data } = await supabase
          .from("events")
          .select("id, title")
          .ilike("title", term)
          .limit(5);
        (data ?? []).forEach((r) =>
          results.push({ id: r.id, title: r.title, kind: "event", route: `/events/${r.id}` }),
        );
      };

      if (type === "all") {
        await Promise.all([
          runServiceProduct("service"),
          runServiceProduct("product"),
          runNews(),
          runEvents(),
        ]);
      } else if (type === "service" || type === "product") {
        await runServiceProduct(type);
      } else if (type === "news") {
        await runNews();
      } else if (type === "event") {
        await runEvents();
      }
      return results;
    },
    staleTime: 30_000,
  });

  const results = searchQ.data ?? [];
  const groups = useMemo(() => {
    const map = new Map<SearchResult["kind"], SearchResult[]>();
    for (const r of results) {
      const arr = map.get(r.kind) ?? [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return Array.from(map.entries());
  }, [results]);

  const handlePick = (r: SearchResult) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    navigate({ to: r.route });
  };

  const wrapperClasses = hero
    ? `relative w-full max-w-2xl mx-auto ${className}`
    : `relative ${className}`;

  const barClasses = hero
    ? "flex items-center gap-1.5 rounded-full border border-[#E3E3E3] bg-white pl-2 pr-3 h-12 md:h-14 shadow-lg focus-within:shadow-xl focus-within:border-[#c9a24b] transition-all"
    : "flex items-center gap-1.5 rounded-full border border-[#E3E3E3] bg-white pl-1 pr-2 h-10 focus-within:shadow-md focus-within:border-[#c9a24b] transition-all";

  return (
    <div ref={wrapRef} className={wrapperClasses}>
      <div className={barClasses}>
        <div className={hero ? "pl-1" : "pl-1"}>
          <Select value={type} onValueChange={(v) => setType(v as SearchType)}>
            <SelectTrigger
              className={
                hero
                  ? "h-10 md:h-12 border-0 shadow-none bg-transparent px-3 text-sm font-semibold text-[#7a5b1d] focus:ring-0 focus:ring-offset-0 gap-1 w-[110px] md:w-[120px]"
                  : "h-8 border-0 shadow-none bg-transparent px-2 text-xs font-semibold text-[#7a5b1d] focus:ring-0 focus:ring-offset-0 gap-1 w-[105px]"
              }
            >
              <SelectValue placeholder="Tất cả">{TYPE_LABELS[type]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TYPE_LABELS) as SearchType[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {TYPE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="w-px h-5 md:h-6 bg-[#E3E3E3]" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Bạn đang tìm kiếm gì?"
          className={`flex-1 bg-transparent outline-none placeholder:text-gray-400 text-[#484848] ${
            hero ? "text-base md:text-lg" : "text-sm"
          } ${inputClassName}`}
        />
        {searchQ.isFetching ? (
          <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-[#c9a24b] animate-spin" />
        ) : (
          <Search className="w-4 h-4 md:w-5 md:h-5 text-[#c9a24b]" />
        )}
      </div>

      {open && enabled && (
        <div
          className={`absolute left-0 right-0 z-50 rounded-2xl border border-[#E3E3E3] bg-white shadow-lg overflow-hidden ${
            hero ? "top-[58px] md:top-[66px]" : "top-[46px]"
          }`}
        >
          {searchQ.isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">Đang tìm…</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Không tìm thấy kết quả
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {groups.map(([kind, arr]) => (
                <div key={kind}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-[#c9a24b]">
                    {TYPE_LABELS[kind]}
                  </div>
                  {arr.map((r) => {
                    const Icon = ICON_BY_KIND[r.kind];
                    return (
                      <button
                        key={`${r.kind}-${r.id}`}
                        type="button"
                        onClick={() => handlePick(r)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#D9F0D6]"
                      >
                        <Icon className="w-4 h-4 text-[#7a5b1d] shrink-0" />
                        <span className="text-sm text-[#484848] line-clamp-1">
                          {r.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
