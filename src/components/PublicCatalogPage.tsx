import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ServiceCard } from "@/components/ServiceCard";
import { ComboCard } from "@/components/ComboCard";
import { useServiceCatalog } from "@/lib/useServiceCatalog";
import { usePublicCombos } from "@/lib/useCombos";
import {
  PRODUCT_CATEGORIES,
  productCategoryLabel,
} from "@/lib/catalogCategories";


type Kind = "product" | "service";

interface Props {
  kind: Kind;
  title: string;
  eyebrow: string;
  subtitle: string;
}

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

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

export function PublicCatalogPage({ kind, title, eyebrow, subtitle }: Props) {
  const { data = [], isLoading, error } = useServiceCatalog();

  const source = useMemo(
    () => data.filter((it) => it.type === kind),
    [data, kind],
  );

  // Price bounds
  const priceBounds = useMemo(() => {
    const nums = source
      .map((s) =>
        s.sale_price && s.sale_price > 0
          ? s.sale_price
          : s.price && s.price > 0
            ? s.price
            : null,
      )
      .filter((n): n is number => n != null);
    if (nums.length === 0) return { min: 0, max: 10_000_000 };
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }, [source]);

  // Categories (dynamic for service, fixed for product)
  const availableCategories = useMemo(() => {
    if (kind === "product") return PRODUCT_CATEGORIES;
    const set = new Set<string>();
    source.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).map((c) => ({ key: c, label: c }));
  }, [kind, source]);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const items = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    return source.filter((it) => {
      const okQ = q
        ? it.name.toLowerCase().includes(q.toLowerCase()) ||
          (it.description ?? "").toLowerCase().includes(q.toLowerCase())
        : true;
      const okCat = cat === "all" ? true : it.category === cat;
      const p =
        it.sale_price && it.sale_price > 0
          ? it.sale_price
          : it.price && it.price > 0
            ? it.price
            : null;
      const okMin = min == null || (p != null && p >= min);
      const okMax = max == null || (p != null && p <= max);
      return okQ && okCat && okMin && okMax;
    });
  }, [source, q, cat, priceMin, priceMax]);

  const reset = () => {
    setQ("");
    setCat("all");
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <section className="bg-[#FAFAFA] min-h-screen">
      <div className="mx-auto max-w-[1240px] px-4 md:px-8 py-8 md:py-14">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 mb-3">
            {eyebrow}
          </span>
          <h1 className="font-heading text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-3 text-gray-500 text-sm md:text-base">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar filters (Desktop) */}
          <aside className="lg:sticky lg:top-20 lg:self-start bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-gray-900 text-sm">
                Bộ lọc
              </h3>
              <button
                onClick={reset}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                Xoá lọc
              </button>
            </div>

            {/* Search */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                Tìm kiếm
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-10">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tên, mô tả..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                Danh mục
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setCat("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cat === "all"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  Tất cả
                </button>
                {availableCategories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cat === c.key
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                {availableCategories.length === 0 && (
                  <p className="text-xs text-gray-400 italic px-1">
                    Chưa có danh mục
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                Khoảng giá (VND)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Từ"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Đến"
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Dải giá: {fmt(priceBounds.min)}đ – {fmt(priceBounds.max)}đ
              </p>
            </div>
          </aside>

          {/* Content */}
          <div>
            {/* Result count */}
            {!isLoading && !error && (
              <div className="flex items-center justify-between mb-4 text-sm">
                <p className="text-gray-500">
                  Hiển thị{" "}
                  <span className="font-semibold text-gray-900">
                    {items.length}
                  </span>{" "}
                  {kind === "product" ? "sản phẩm" : "dịch vụ"}
                  {cat !== "all" && (
                    <>
                      {" "}
                      trong{" "}
                      <span className="font-semibold text-emerald-700">
                        {kind === "product"
                          ? productCategoryLabel(cat)
                          : cat}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}

            {error ? (
              <div className="text-center text-rose-600 py-16">
                Không tải được dữ liệu.
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500 mb-3">
                  Không tìm thấy{" "}
                  {kind === "product" ? "sản phẩm" : "dịch vụ"} phù hợp.
                </p>
                <button
                  onClick={reset}
                  className="inline-flex px-4 h-10 items-center rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                >
                  Xoá bộ lọc
                </button>
                <div className="mt-4">
                  <Link
                    to="/"
                    className="text-emerald-700 hover:underline font-semibold text-sm"
                  >
                    ← Về trang chủ
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {items.map((it) => (
                  <ServiceCard
                    key={it.id}
                    item={it}
                    variant="web"
                    linkTo="web"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
