import { createFileRoute, Link } from "@tanstack/react-router";
import { ServiceCard } from "@/components/ServiceCard";
import { useServiceCatalog } from "@/lib/useServiceCatalog";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_public/products/")({
  component: ProductsPage,
});

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "product", label: "Sản phẩm" },
  { key: "service", label: "Dịch vụ / Liệu trình" },
] as const;

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-6 bg-gray-100 rounded w-1/2 mt-2" />
        <div className="h-10 bg-gray-100 rounded mt-3" />
      </div>
    </div>
  );
}

function ProductsPage() {
  const { data = [], isLoading, error } = useServiceCatalog();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    return data.filter((it) => {
      const okTab = tab === "all" ? true : it.type === tab;
      const okQ = q
        ? it.name.toLowerCase().includes(q.toLowerCase()) ||
          (it.description ?? "").toLowerCase().includes(q.toLowerCase())
        : true;
      return okTab && okQ;
    });
  }, [data, tab, q]);

  return (
    <section className="bg-[#FAFAFA] min-h-screen">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8 py-8 md:py-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 mb-3">
            VITA TH Pro · Catalog
          </span>
          <h1 className="font-heading text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            Sản phẩm & Dịch vụ
          </h1>
          <p className="mt-3 text-gray-500 text-sm md:text-base">
            Giải pháp chăm sóc sức khỏe & sắc đẹp toàn diện — từ thiết bị công
            nghệ cao đến liệu trình chuyên sâu.
          </p>
        </div>

        {/* Filter bar */}
        <div className="sticky top-[64px] z-20 -mx-4 md:mx-0 mb-6 bg-[#FAFAFA]/90 backdrop-blur px-4 md:px-0 py-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 h-11 shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm sản phẩm, liệu trình..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={
                    "whitespace-nowrap h-11 px-4 rounded-full text-sm font-semibold border transition-colors " +
                    (tab === t.key
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center text-rose-600 py-16">
            Không tải được dữ liệu.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Chưa có sản phẩm phù hợp.</p>
            <Link
              to="/"
              className="text-emerald-700 hover:underline font-semibold text-sm mt-2 inline-block"
            >
              ← Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((it) => (
              <ServiceCard key={it.id} item={it} variant="web" linkTo="web" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
