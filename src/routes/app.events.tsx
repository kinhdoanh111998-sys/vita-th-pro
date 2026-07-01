import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, Search } from "lucide-react";
import {
  EVENT_CATEGORIES,
  formatDateTime,
  isUpcoming,
  type EventRow,
} from "@/lib/events";

export const Route = createFileRoute("/app/events")({
  component: AppEventsList,
});

function AppEventsList() {
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
    <div className="pb-6">
      <header className="sticky top-0 z-30 bg-[#fafaf7]/95 backdrop-blur px-4 pt-4 pb-3">
        <h1 className="font-heading text-lg font-black text-gray-900">
          Sự kiện VITA
        </h1>
        <div className="mt-3 flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-sm px-3 h-11">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm sự kiện..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <div className="mt-3 inline-flex rounded-full bg-white border border-gray-200 p-1 shadow-sm">
          {(
            [
              ["upcoming", "Sắp tổ chức"],
              ["past", "Đã diễn ra"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`px-4 h-9 rounded-full text-xs font-semibold ${
                tab === v
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {["all", ...EVENT_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-3 h-8 rounded-full text-[11px] font-semibold border ${
                cat === c
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {c === "all" ? "Tất cả" : c}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 flex flex-col gap-3">
        {listQ.isLoading ? (
          <p className="text-gray-500">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center text-gray-500">
            Chưa có sự kiện phù hợp
          </div>
        ) : (
          filtered.map((e) => {
            const up = isUpcoming(e);
            return (
              <Link
                key={e.id}
                to="/app/events/$id"
                params={{ id: e.id }}
                className="flex gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
              >
                {e.cover_url ? (
                  <img
                    src={e.cover_url}
                    alt=""
                    loading="lazy"
                    className="w-28 h-28 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-emerald-100 to-amber-50 shrink-0" />
                )}
                <div className="flex-1 py-2.5 pr-3 flex flex-col gap-1 min-w-0">
                  <span
                    className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      up
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {up ? "Sắp diễn ra" : "Đã diễn ra"}
                  </span>
                  <h3 className="text-sm font-heading font-bold text-gray-900 line-clamp-2 leading-snug">
                    {e.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-gray-600">
                    <CalendarDays className="w-3 h-3 text-emerald-600" />
                    <span className="truncate">
                      {formatDateTime(e.start_at)}
                    </span>
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span className="truncate">{e.location}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
