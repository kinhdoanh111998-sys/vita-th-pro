import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string | number;
  name: string;
  short_description?: string | null;
  summary?: string | null;
  price?: number | null;
  sale_price?: number | null;
  gallery?: string[] | null;
  badge?: string | null;
  cta_type?: string | null;
};

export const Route = createFileRoute("/_public/products/")({
  component: ProductsPage,
});

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";

function badgeClass(badge: string) {
  const b = badge.toLowerCase();
  if (b.includes("sale") || b.includes("giảm"))
    return "bg-status-warning text-white";
  if (b.includes("new") || b.includes("mới"))
    return "bg-status-success text-white";
  if (b.includes("hot")) return "bg-status-error text-white";
  return "bg-status-info text-white";
}

function SkeletonCard() {
  return (
    <div className="bg-brand-surface rounded-card border border-brand-border overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-brand-border/40" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-brand-border/60 rounded w-3/4" />
        <div className="h-4 bg-brand-border/40 rounded w-full" />
        <div className="h-4 bg-brand-border/40 rounded w-1/2" />
        <div className="h-11 bg-brand-border/40 rounded mt-4" />
      </div>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  const img = p.gallery && p.gallery.length > 0 ? p.gallery[0] : null;
  const desc = p.short_description ?? p.summary ?? "";
  const hasSale =
    typeof p.sale_price === "number" &&
    p.sale_price > 0 &&
    typeof p.price === "number" &&
    p.price > p.sale_price;
  const ctaLabel = p.cta_type === "contact" ? "Liên hệ tư vấn" : "Đặt mua ngay";

  return (
    <Link
      to="/products/$id"
      params={{ id: String(p.id) }}
      className="group block bg-brand-surface rounded-card border border-brand-border overflow-hidden transition-shadow hover:shadow-md flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-brand-bg">
        {img ? (
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted">
            <ImageIcon className="w-10 h-10" aria-hidden />
          </div>
        )}
        {p.badge ? (
          <span
            className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-md ${badgeClass(p.badge)}`}
          >
            {p.badge}
          </span>
        ) : null}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-brand-text text-lg line-clamp-2 group-hover:text-brand-primary transition-colors">
          {p.name}
        </h3>
        {desc ? (
          <p className="font-body text-brand-muted text-sm mt-2 line-clamp-2">
            {desc}
          </p>
        ) : null}

        <div className="mt-4 flex items-baseline gap-2 flex-wrap">
          {hasSale ? (
            <>
              <span className="text-brand-primary font-bold text-xl">
                {formatVND(p.sale_price as number)}
              </span>
              <span className="text-brand-muted text-sm line-through">
                {formatVND(p.price as number)}
              </span>
            </>
          ) : typeof p.price === "number" && p.price > 0 ? (
            <span className="text-brand-primary font-bold text-xl">
              {formatVND(p.price)}
            </span>
          ) : (
            <span className="text-brand-muted text-sm">Liên hệ báo giá</span>
          )}
        </div>

        <span
          className="mt-5 w-full h-[44px] flex items-center justify-center rounded-[8px] bg-brand-primary text-white font-medium group-hover:bg-brand-primary-dark transition-colors"
        >
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}

function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const rows: Product[] = (data ?? []).map((r: Record<string, unknown>) => {
        let gallery: string[] | null = null;
        const g = r.gallery;
        if (Array.isArray(g)) gallery = g.filter((x) => typeof x === "string") as string[];
        else if (typeof g === "string" && g.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(g);
            if (Array.isArray(parsed)) gallery = parsed.filter((x) => typeof x === "string");
          } catch { /* noop */ }
        } else if (typeof g === "string" && g) gallery = [g];
        return {
          id: (r.id as string | number) ?? "",
          name: (r.name as string) ?? "Chưa đặt tên",
          short_description: (r.short_description as string) ?? null,
          summary: (r.summary as string) ?? null,
          price: r.price != null ? Number(r.price) : null,
          sale_price: r.sale_price != null ? Number(r.sale_price) : null,
          gallery,
          badge: (r.badge as string) ?? null,
          cta_type: (r.cta_type as string) ?? null,
        };
      });
      setItems(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-brand-bg min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:py-16">
        <h1 className="font-heading text-brand-text text-3xl md:text-4xl font-bold text-center mb-12">
          Sản phẩm & Dịch vụ
        </h1>

        {error ? (
          <div className="text-center text-status-error">
            Không tải được dữ liệu: {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-brand-muted">
            Chưa có sản phẩm nào.{" "}
            <Link to="/" className="text-brand-primary hover:underline">
              Về trang chủ
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <ProductCard key={String(p.id)} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
