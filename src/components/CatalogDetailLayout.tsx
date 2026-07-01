import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  ImageIcon,
  ChevronRight,
  ArrowLeft,
  ShoppingCart,
  CalendarCheck,
  Package,
  Sparkles,
  Minus,
  Plus,
} from "lucide-react";
import type { CatalogItem } from "@/lib/useServiceCatalog";
import { productCategoryLabel } from "@/lib/catalogCategories";

interface Props {
  item: CatalogItem;
  crumbHref: "/products" | "/services";
  crumbLabel: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " đ";

export function CatalogDetailLayout({ item, crumbHref, crumbLabel }: Props) {
  const gallery = useMemo(() => {
    if (item.image_urls && item.image_urls.length > 0) return item.image_urls;
    if (item.image_url) return [item.image_url];
    return [] as string[];
  }, [item]);

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const isService = item.type === "service";
  const hasSale =
    typeof item.sale_price === "number" &&
    item.sale_price > 0 &&
    typeof item.price === "number" &&
    item.price > item.sale_price;
  const percent =
    hasSale && item.price
      ? Math.round(
          ((item.price - (item.sale_price as number)) / item.price) * 100,
        )
      : 0;

  const catLabel = isService
    ? item.category ?? "Dịch vụ"
    : productCategoryLabel(item.category);

  return (
    <section className="bg-brand-bg min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-brand-muted mb-6">
          <Link to="/" className="hover:text-brand-primary">
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={crumbHref} className="hover:text-brand-primary">
            {crumbLabel}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-brand-text line-clamp-1">{item.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square bg-white rounded-2xl border border-hairline overflow-hidden shadow-sm">
              {gallery.length > 0 ? (
                <img
                  src={gallery[active] ?? gallery[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-muted">
                  <ImageIcon className="w-16 h-16" aria-hidden />
                </div>
              )}
              {hasSale && (
                <span className="absolute top-4 left-4 bg-status-error text-white text-xs font-black px-3 py-1.5 rounded-full shadow">
                  -{percent}%
                </span>
              )}
              <span className="absolute top-4 right-4 bg-white/95 backdrop-blur text-ink text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {isService ? "Dịch vụ" : "Sản phẩm"}
              </span>
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {gallery.slice(0, 10).map((src, i) => (
                  <button
                    type="button"
                    key={src + i}
                    onClick={() => setActive(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === active
                        ? "border-brand-primary ring-2 ring-brand-primary/20"
                        : "border-hairline hover:border-brand-primary/60"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${item.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 rounded-full px-2.5 py-1">
                <Sparkles className="w-3 h-3" /> {catLabel}
              </span>
              {item.sku && (
                <span className="text-[11px] font-mono text-ink-muted">
                  SKU: {item.sku}
                </span>
              )}
            </div>

            <h1 className="font-heading text-brand-text text-3xl md:text-4xl font-black leading-tight">
              {item.name}
            </h1>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3 flex-wrap">
              {hasSale ? (
                <>
                  <span className="text-brand-primary font-black text-3xl md:text-4xl">
                    {fmt(item.sale_price as number)}
                  </span>
                  <span className="text-brand-muted text-lg line-through">
                    {fmt(item.price as number)}
                  </span>
                </>
              ) : typeof item.price === "number" && item.price > 0 ? (
                <span className="text-brand-primary font-black text-3xl md:text-4xl">
                  {fmt(item.price)}
                </span>
              ) : (
                <span className="text-brand-muted">Liên hệ báo giá</span>
              )}
            </div>

            {/* Meta badge */}
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              {isService ? (
                <span className="inline-flex items-center gap-1.5 bg-status-info/10 text-status-info px-3 py-1.5 rounded-lg text-sm font-bold">
                  <CalendarCheck className="w-4 h-4" />
                  Số buổi: {item.default_sessions ?? 1}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                    (item.stock_quantity ?? 0) > 0
                      ? "bg-status-success/10 text-status-success"
                      : "bg-status-error/10 text-status-error"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {(item.stock_quantity ?? 0) > 0
                    ? `Tồn kho: ${item.stock_quantity}`
                    : "Tạm hết hàng"}
                </span>
              )}
            </div>

            {item.description && (
              <div className="mt-6 text-brand-text/80 text-sm leading-relaxed line-clamp-3">
                {/* Preview đoạn ngắn — chi tiết ở bố cục dưới */}
                <span
                  dangerouslySetInnerHTML={{
                    __html: item.description
                      .replace(/<[^>]+>/g, " ")
                      .slice(0, 240),
                  }}
                />
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to={isService ? "/booking" : "/contact"}
                className="h-12 px-6 flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-white font-bold transition-colors bg-brand-primary hover:bg-brand-primary-dark shadow-md"
              >
                {isService ? (
                  <>
                    <CalendarCheck className="w-5 h-5" /> Đặt lịch ngay
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ hàng
                  </>
                )}
              </Link>
              <Link
                to={crumbHref}
                className="h-12 px-6 inline-flex items-center justify-center rounded-xl border border-hairline text-brand-text font-semibold hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> {crumbLabel}
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs Ô cửa sổ: Mô tả chi tiết + Đặc trưng */}
        {(item.description || item.features) && (
          <div className="mt-12 bg-white rounded-2xl border border-hairline shadow-sm overflow-hidden">
            <Tabs defaultValue={item.description ? "description" : "features"}>
              <div className="border-b border-hairline bg-brand-bg/40 px-4 md:px-6 pt-4">
                <TabsList className="bg-transparent h-auto p-0 gap-2">
                  {item.description && (
                    <TabsTrigger
                      value="description"
                      className="rounded-t-lg rounded-b-none px-5 py-3 text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-none data-[state=active]:border data-[state=active]:border-b-white data-[state=active]:border-hairline text-brand-muted -mb-px"
                    >
                      Mô tả chi tiết
                    </TabsTrigger>
                  )}
                  {item.features && (
                    <TabsTrigger
                      value="features"
                      className="rounded-t-lg rounded-b-none px-5 py-3 text-sm md:text-base font-bold data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-none data-[state=active]:border data-[state=active]:border-b-white data-[state=active]:border-hairline text-brand-muted -mb-px"
                    >
                      {isService ? "Đặc trưng dịch vụ" : "Đặc trưng sản phẩm"}
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {item.description && (
                <TabsContent value="description" className="p-6 md:p-10 mt-0">
                  <div
                    className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-black prose-h2:text-2xl prose-h3:text-xl prose-strong:text-brand-text prose-a:text-brand-primary prose-li:my-1 prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </TabsContent>
              )}
              {item.features && (
                <TabsContent value="features" className="p-6 md:p-10 mt-0">
                  <div
                    className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-black prose-h2:text-2xl prose-h3:text-xl prose-strong:text-brand-text prose-a:text-brand-primary prose-li:my-1 prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: item.features }}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </section>
  );
}
