import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { ServiceCard } from "@/components/ServiceCard";
import { useServiceCatalog } from "@/lib/useServiceCatalog";

interface Props {
  kind: "product" | "service";
  title: string;
  eyebrow: string;
  viewAllHref: "/products" | "/services";
  variant?: "web" | "app";
  limit?: number;
}

export function FeaturedCatalogSection({
  kind,
  title,
  eyebrow,
  viewAllHref,
  variant = "web",
  limit = 8,
}: Props) {
  const { data = [], isLoading } = useServiceCatalog();
  const items = data.filter((d) => d.type === kind).slice(0, limit);

  if (!isLoading && items.length === 0) return null;

  const gridCls =
    variant === "web"
      ? "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
      : "grid grid-cols-2 gap-3";

  return (
    <section className="pt-8 max-w-7xl mx-auto w-full px-4 md:px-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
            {eyebrow}
          </div>
          <h2 className="text-lg md:text-2xl font-heading font-black text-gray-900">
            {title}
          </h2>
        </div>
        <Link
          to={viewAllHref}
          className="text-xs md:text-sm text-emerald-600 flex items-center gap-0.5 font-semibold hover:underline"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {isLoading ? (
        <div className={gridCls}>
          {Array.from({ length: variant === "web" ? 4 : 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={gridCls}>
          {items.map((it) => (
            <ServiceCard
              key={it.id}
              item={it}
              variant={variant === "app" ? "app" : "web"}
              linkTo={variant === "app" ? "app" : "web"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
