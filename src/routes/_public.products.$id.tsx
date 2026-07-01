import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImageIcon, ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string | number;
  name: string;
  short_description?: string | null;
  summary?: string | null;
  description?: string | null;
  price?: number | null;
  sale_price?: number | null;
  gallery?: string[] | null;
  badge?: string | null;
  cta_type?: string | null;
  specifications?: Record<string, unknown> | null;
};

export const Route = createFileRoute("/_public/products/$id")({
  component: ProductDetailPage,
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

function parseGallery(g: unknown): string[] {
  if (Array.isArray(g))
    return g.filter((x) => typeof x === "string") as string[];
  if (typeof g === "string" && g.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(g);
      if (Array.isArray(parsed))
        return parsed.filter((x) => typeof x === "string");
    } catch {
      /* noop */
    }
  }
  if (typeof g === "string" && g) return [g];
  return [];
}

function parseSpecs(s: unknown): Record<string, unknown> | null {
  if (!s) return null;
  if (typeof s === "object") return s as Record<string, unknown>;
  if (typeof s === "string") {
    try {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* noop */
    }
  }
  return null;
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
      <div className="aspect-square bg-brand-border/40 rounded-card" />
      <div className="space-y-4">
        <div className="h-6 w-20 bg-brand-border/50 rounded" />
        <div className="h-10 w-3/4 bg-brand-border/60 rounded" />
        <div className="h-8 w-1/2 bg-brand-border/50 rounded" />
        <div className="h-4 w-full bg-brand-border/40 rounded" />
        <div className="h-4 w-5/6 bg-brand-border/40 rounded" />
        <div className="h-4 w-4/6 bg-brand-border/40 rounded" />
        <div className="h-11 w-full bg-brand-border/50 rounded mt-6" />
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setProduct(null);
        setLoading(false);
        return;
      }
      const r = data as Record<string, unknown>;
      setProduct({
        id: (r.id as string | number) ?? id,
        name: (r.name as string) ?? "Chưa đặt tên",
        short_description: (r.short_description as string) ?? null,
        summary: (r.summary as string) ?? null,
        description: (r.description as string) ?? null,
        price: r.price != null ? Number(r.price) : null,
        sale_price: r.sale_price != null ? Number(r.sale_price) : null,
        gallery: parseGallery(r.gallery),
        badge: (r.badge as string) ?? null,
        cta_type: (r.cta_type as string) ?? null,
        specifications: parseSpecs(r.specifications),
      });
      setLoading(false);
      setActiveImg(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const hasSale =
    product &&
    typeof product.sale_price === "number" &&
    product.sale_price > 0 &&
    typeof product.price === "number" &&
    product.price > product.sale_price;
  const isContact = product?.cta_type === "contact";
  const ctaLabel = isContact ? "Liên hệ tư vấn" : "Đặt mua ngay";
  const ctaClass = isContact
    ? "bg-status-info hover:brightness-95"
    : "bg-brand-primary hover:bg-brand-primary-dark";

  const specEntries = product?.specifications
    ? Object.entries(product.specifications)
    : [];

  return (
    <section className="bg-brand-bg min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-brand-muted mb-6">
          <Link to="/" className="hover:text-brand-primary">
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/products" className="hover:text-brand-primary">
            Sản phẩm
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-brand-text line-clamp-1">
            {product?.name ?? "Chi tiết"}
          </span>
        </nav>

        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="bg-brand-surface rounded-card border border-brand-border p-8 text-center">
            <p className="text-status-error mb-4">
              Không tải được sản phẩm: {error}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-brand-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
            </Link>
          </div>
        ) : !product ? (
          <div className="bg-brand-surface rounded-card border border-brand-border p-10 text-center">
            <h2 className="font-heading text-2xl font-bold text-brand-text mb-2">
              Không tìm thấy sản phẩm
            </h2>
            <p className="text-brand-muted mb-6">
              Sản phẩm bạn tìm không tồn tại hoặc đã bị gỡ khỏi hệ thống.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-brand-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square bg-brand-surface rounded-card border border-brand-border overflow-hidden">
                {product.gallery && product.gallery.length > 0 ? (
                  <img
                    src={product.gallery[activeImg] ?? product.gallery[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted">
                    <ImageIcon className="w-16 h-16" aria-hidden />
                  </div>
                )}
                {product.badge ? (
                  <span
                    className={`absolute top-4 left-4 text-xs font-medium px-3 py-1.5 rounded-md ${badgeClass(product.badge)}`}
                  >
                    {product.badge}
                  </span>
                ) : null}
              </div>

              {product.gallery && product.gallery.length > 1 ? (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {product.gallery.slice(0, 5).map((src, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? "border-brand-primary" : "border-brand-border hover:border-brand-muted"}`}
                    >
                      <img
                        src={src}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <h1 className="font-heading text-brand-text text-3xl md:text-4xl font-bold leading-tight">
                {product.name}
              </h1>

              {(product.short_description || product.summary) && (
                <p className="font-body text-brand-muted mt-3">
                  {product.short_description ?? product.summary}
                </p>
              )}

              <div className="mt-5 flex items-baseline gap-3 flex-wrap">
                {hasSale ? (
                  <>
                    <span className="text-brand-primary font-bold text-3xl">
                      {formatVND(product.sale_price as number)}
                    </span>
                    <span className="text-brand-muted text-lg line-through">
                      {formatVND(product.price as number)}
                    </span>
                  </>
                ) : typeof product.price === "number" && product.price > 0 ? (
                  <span className="text-brand-primary font-bold text-3xl">
                    {formatVND(product.price)}
                  </span>
                ) : (
                  <span className="text-brand-muted">Liên hệ báo giá</span>
                )}
              </div>

              {product.description && (
                <div className="mt-6">
                  <h2 className="font-heading text-lg font-bold text-brand-text mb-2">
                    Mô tả chi tiết
                  </h2>
                  <div className="font-body text-brand-text whitespace-pre-line leading-relaxed">
                    {product.description}
                  </div>
                </div>
              )}

              {specEntries.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-heading text-lg font-bold text-brand-text mb-3">
                    Thông số kỹ thuật
                  </h2>
                  <div className="rounded-card border border-brand-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {specEntries.map(([k, v], i) => (
                          <tr
                            key={k}
                            className={i % 2 === 0 ? "bg-brand-surface" : "bg-brand-bg"}
                          >
                            <td className="px-4 py-3 font-medium text-brand-text w-2/5 border-b border-brand-border last:border-b-0">
                              {k}
                            </td>
                            <td className="px-4 py-3 text-brand-muted border-b border-brand-border last:border-b-0">
                              {typeof v === "object" ? JSON.stringify(v) : String(v)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to={isContact ? "/contact" : "/booking"}
                  className={`h-[44px] px-6 flex-1 flex items-center justify-center rounded-[8px] text-white font-medium transition-colors ${ctaClass}`}
                >
                  {ctaLabel}
                </Link>
                <Link
                  to="/products"
                  className="h-[44px] px-6 flex items-center justify-center rounded-[8px] border border-brand-border text-brand-text font-medium hover:bg-brand-surface transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Danh sách
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
