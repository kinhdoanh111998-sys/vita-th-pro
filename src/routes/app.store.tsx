import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { FilterSidebar, type AppStoreFilters } from "@/components/app/FilterSidebar";
import { ServiceCard } from "@/components/ServiceCard";
import { useServiceCatalog } from "@/lib/useServiceCatalog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

const BRANCHES = [
  { id: "hn", label: "Cơ sở 1 - Hà Nội" },
  { id: "dn", label: "Cơ sở 2 - Đà Nẵng" },
  { id: "hcm", label: "Cơ sở 3 - TP.HCM" },
];


const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "product", label: "Sản phẩm" },
  { key: "service", label: "Dịch vụ" },
] as const;

const DEFAULT_FILTERS: AppStoreFilters = {
  priceMin: "",
  priceMax: "",
  productCats: [],
  serviceCats: [],
  rating: null,
};

function StorePage() {
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AppStoreFilters>(DEFAULT_FILTERS);
  const { data = [], isLoading, error } = useServiceCatalog();

  const serviceCategories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => d.type === "service" && d.category && set.add(d.category));
    return Array.from(set).sort();
  }, [data]);

  const activeFilterCount =
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    filters.productCats.length +
    filters.serviceCats.length +
    (filters.rating ? 1 : 0);

  const filtered = useMemo(() => {
    const min = filters.priceMin ? Number(filters.priceMin) : null;
    const max = filters.priceMax ? Number(filters.priceMax) : null;
    return data.filter((p) => {
      const matchTab = tab === "all" || p.type === tab;
      const matchSearch = search
        ? p.name.toLowerCase().includes(search.toLowerCase())
        : true;

      // Category filter — apply per type
      let matchCat = true;
      const hasProd = filters.productCats.length > 0;
      const hasSvc = filters.serviceCats.length > 0;
      if (hasProd || hasSvc) {
        if (p.type === "product") {
          matchCat = hasProd
            ? filters.productCats.includes(p.category ?? "")
            : !hasSvc; // if only service filter set, hide products
        } else {
          matchCat = hasSvc
            ? filters.serviceCats.includes(p.category ?? "")
            : !hasProd;
        }
      }

      const price =
        p.sale_price && p.sale_price > 0
          ? p.sale_price
          : p.price && p.price > 0
            ? p.price
            : null;
      const matchMin = min == null || (price != null && price >= min);
      const matchMax = max == null || (price != null && price <= max);

      return matchTab && matchSearch && matchCat && matchMin && matchMax;
    });
  }, [data, tab, search, filters]);

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
              className="relative flex items-center gap-1.5 bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-100 text-sm text-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Lọc</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold grid place-items-center">
                  {activeFilterCount}
                </span>
              )}
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

      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        serviceCategories={serviceCategories}
        value={filters}
        onApply={setFilters}
      />
    </div>
  );
}

export const Route = createFileRoute("/app/store")({
  component: StorePage,
});
