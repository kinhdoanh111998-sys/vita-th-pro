import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, CalendarDays, MapPin } from "lucide-react";
import {
  EVENT_CATEGORIES,
  formatDateTime,
  isUpcoming,
  type EventRow,
} from "@/lib/events";

export const Route = createFileRoute("/_public/events")({
  head: () => ({
    meta: [
      { title: "Sự kiện — VITA TH Pro" },
      {
        name: "description",
        content:
          "Danh sách sự kiện, hội thảo và tri ân khách hàng của VITA TH Pro.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cat, setCat] = useState<string>("all");

  const listQ = useQuery({
    queryKey: ["public", "events"],
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
        const up = isUpcoming(r);
        if (tab === "upcoming" && !up) return false;
        if (tab === "past" && up) return false;
        if (cat !== "all" && r.category !== cat) return false;
        if (q.trim() && !r.title.toLowerCase().includes(q.trim().toLowerCase()))
          return false;
        return true;
      }),
    [rows, tab, cat, q],
  );

  return (
    <section className="py-10 md:py-14 bg-[#fafaf7] min-h-screen">
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Đừng bỏ lỡ
        </p>
        <h1 className="mt-1 font-heading text-3xl md:text-[38px] font-black tracking-tight text-gray-900">
          Sự kiện VITA TH Pro
        </h1>
        <p className="mt-2 text-gray-500 max-w-[620px]">
          Hội thảo công nghệ, tri ân khách hàng và các buổi trải nghiệm dịch vụ
          cao cấp.
        </p>

        {/* Search */}
        <div className="mt-6 flex items-center gap-2 max-w-xl bg-white rounded-full border border-gray-200 shadow-sm px-4 h-12">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm sự kiện..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-white border border-gray-200 p-1 shadow-sm">
            {(
              [
                ["upcoming", "Sắp tổ chức"],
                ["past", "Đã diễn ra"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`px-5 h-10 rounded-full text-sm font-semibold transition-colors ${
                  tab === v
                    ? "bg-emerald-600 text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 ml-1">
            <CatChip active={cat === "all"} onClick={() => setCat("all")}>
              Tất cả
            </CatChip>
            {EVENT_CATEGORIES.map((c) => (
              <CatChip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </CatChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8">
          {listQ.isLoading ? (
            <p className="text-gray-500">Đang tải sự kiện...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-500">
              Chưa có sự kiện phù hợp
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-9 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-white border-gray-200 text-gray-600 hover:border-emerald-200"
      }`}
    >
      {children}
    </button>
  );
}

function EventCard({ e }: { e: EventRow }) {
  const up = isUpcoming(e);
  return (
    <Link
      to="/events/$id"
      params={{ id: e.id }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        {e.cover_url ? (
          <img
            src={e.cover_url}
            alt={e.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : null}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-md ${
            up ? "bg-amber-500 text-white" : "bg-gray-800/85 text-white"
          }`}
        >
          {up ? "Sắp tổ chức" : "Đã diễn ra"}
        </span>
        {e.category && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 text-emerald-700 shadow">
            {e.category}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-heading font-bold text-[17px] text-gray-900 leading-snug line-clamp-2">
          {e.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
          <span className="truncate">{formatDateTime(e.start_at)}</span>
        </div>
        {e.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">{e.location}</span>
          </div>
        )}
        <span className="mt-auto pt-3 text-sm font-semibold text-emerald-700 group-hover:underline">
          Xem chi tiết →
        </span>
      </div>
    </Link>
  );
}
