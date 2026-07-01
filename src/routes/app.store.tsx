import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { FilterSidebar } from "@/components/app/FilterSidebar";
import { ServiceCard } from "@/components/ServiceCard";
import { useServiceCatalog } from "@/lib/useServiceCatalog";

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "product", label: "Sản phẩm" },
  { key: "service", label: "Liệu trình" },
] as const;

function StorePage() {
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const { data = [], isLoading, error } = useServiceCatalog();

  const filtered = useMemo(
    () =>
      data.filter((p) => {
        const matchCat = tab === "all" || p.type === tab;
        const matchSearch = search
          ? p.name.toLowerCase().includes(search.toLowerCase())
          : true;
        return matchCat && matchSearch;
      }),
    [data, tab, search],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-12">
      {/* Search + Filter */}
      <div className="sticky top-0 md:top-16 z-10 bg-gray-50/95 backdrop-blur px-4 md:px-8 pt-3 pb-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-100">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm, liệu trình..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              aria-label="Mở bộ lọc"
              className="flex items-center gap-1.5 bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-100 text-sm text-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Lọc</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setTab(cat.key)}
                className={`whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                  tab === cat.key
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-3">
        {error ? (
          <div className="text-center text-rose-600 py-16">
            Không tải được dữ liệu.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-16">
            Không tìm thấy sản phẩm
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filtered.map((item) => (
              <ServiceCard
                key={item.id}
                item={item}
                variant="app"
                linkTo="app"
              />
            ))}
          </div>
        )}
      </div>

      <FilterSidebar open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
}

export const Route = createFileRoute("/app/store")({
  component: StorePage,
});
