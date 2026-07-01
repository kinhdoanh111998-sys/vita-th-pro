import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Heart,
  Share2,
  ShoppingCart,
  CalendarCheck,
  Package,
  Sparkles,
  Minus,
  Plus,
  ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { CatalogItem } from "@/lib/useServiceCatalog";
import { productCategoryLabel } from "@/lib/catalogCategories";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/store/$productId")({
  component: ProductDetailPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";

async function fetchItem(id: string): Promise<CatalogItem | null> {
  const { data, error } = await supabase
    .from("services_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id ?? id),
    name: (r.name as string) ?? "Chưa đặt tên",
    description: (r.description as string) ?? null,
    features: (r.features as string) ?? null,
    price: r.price != null ? Number(r.price) : null,
    sale_price: r.sale_price != null ? Number(r.sale_price) : null,
    default_sessions:
      r.default_sessions != null ? Number(r.default_sessions) : null,
    image_url: (r.image_url as string) ?? null,
    image_urls: Array.isArray(r.image_urls)
      ? ((r.image_urls as unknown[]).filter(
          (x) => typeof x === "string",
        ) as string[])
      : null,
    sku: (r.sku as string) ?? null,
    type: (r.type as string) === "service" ? "service" : "product",
    category: (r.category as string) ?? null,
    stock_quantity:
      r.stock_quantity != null ? Number(r.stock_quantity) : null,
  };
}

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["catalog", "detail", productId],
    queryFn: () => fetchItem(productId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="aspect-square bg-gray-200" />
        <div className="p-4 space-y-3">
          <div className="h-6 w-1/2 bg-gray-200 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="h-20 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-center">
        <p className="mt-16 text-gray-600">
          {error ? (error as Error).message : "Không tìm thấy sản phẩm."}
        </p>
        <Link
          to="/app/store"
          className="mt-4 inline-flex text-emerald-600 font-semibold"
        >
          ← Về cửa hàng
        </Link>
      </div>
    );
  }

  const p = data;
  const gallery =
    p.image_urls && p.image_urls.length > 0
      ? p.image_urls
      : p.image_url
        ? [p.image_url]
        : [];
  const isService = p.type === "service";
  const hasSale =
    typeof p.sale_price === "number" &&
    p.sale_price > 0 &&
    typeof p.price === "number" &&
    p.price > p.sale_price;
  const percent =
    hasSale && p.price
      ? Math.round(((p.price - (p.sale_price as number)) / p.price) * 100)
      : 0;
  const showPrice =
    hasSale && p.sale_price != null
      ? p.sale_price
      : p.price != null && p.price > 0
        ? p.price
        : null;

  const catLabel = isService
    ? p.category ?? "Dịch vụ"
    : productCategoryLabel(p.category);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Image header */}
      <div className="relative bg-white">
        {gallery.length > 0 ? (
          <img
            src={gallery[active] ?? gallery[0]}
            alt={p.name}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="w-full aspect-square grid place-items-center bg-gray-100 text-gray-300">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}
        <Link
          to="/app/store"
          className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md"
          aria-label="Quay lại"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </Link>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md">
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        {hasSale && (
          <span className="absolute bottom-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
            -{percent}%
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {gallery.length > 1 && (
        <div className="bg-white px-3 py-2 flex gap-2 overflow-x-auto">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                i === active ? "border-emerald-500" : "border-gray-200"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Info card */}
      <div className="bg-white mt-2 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full px-2 py-1">
            <Sparkles className="w-3 h-3" />
            {catLabel}
          </span>
          {p.sku && (
            <span className="text-[10px] font-mono text-gray-400">
              SKU: {p.sku}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 flex-wrap">
          {showPrice != null ? (
            <>
              <span className="text-2xl font-bold text-rose-500">
                {fmt(showPrice)}
              </span>
              {hasSale && (
                <span className="text-sm text-gray-400 line-through">
                  {fmt(p.price as number)}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500 italic text-sm">Liên hệ báo giá</span>
          )}
        </div>

        <h1 className="text-lg font-bold text-gray-900 leading-snug">
          {p.name}
        </h1>

        {isService ? (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">
            <CalendarCheck className="w-3.5 h-3.5" />
            Số buổi: {p.default_sessions ?? 1}
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              (p.stock_quantity ?? 0) > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            {(p.stock_quantity ?? 0) > 0
              ? `Tồn kho: ${p.stock_quantity}`
              : "Tạm hết hàng"}
          </span>
        )}
      </div>

      {/* Quantity (product only) */}
      {!isService && (
        <div className="bg-white mt-2 p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Số lượng</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Ô cửa sổ: Mô tả + Đặc trưng */}
      {(p.description || p.features) && (
        <div className="bg-white mt-2 rounded-t-2xl overflow-hidden">
          <Tabs defaultValue={p.description ? "description" : "features"}>
            <div className="border-b border-gray-100 px-3 pt-3">
              <TabsList className="bg-transparent h-auto p-0 gap-1">
                {p.description && (
                  <TabsTrigger
                    value="description"
                    className="rounded-t-lg rounded-b-none px-4 py-2.5 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none text-gray-500"
                  >
                    Mô tả
                  </TabsTrigger>
                )}
                {p.features && (
                  <TabsTrigger
                    value="features"
                    className="rounded-t-lg rounded-b-none px-4 py-2.5 text-sm font-bold data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none text-gray-500"
                  >
                    {isService ? "Đặc trưng dịch vụ" : "Đặc trưng sản phẩm"}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            {p.description && (
              <TabsContent value="description" className="p-4 mt-0">
                <div
                  className="prose prose-sm max-w-none prose-headings:font-bold prose-strong:text-gray-900 prose-a:text-emerald-600 prose-li:my-1 prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
              </TabsContent>
            )}
            {p.features && (
              <TabsContent value="features" className="p-4 mt-0">
                <div
                  className="prose prose-sm max-w-none prose-headings:font-bold prose-strong:text-gray-900 prose-a:text-emerald-600 prose-li:my-1 prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ __html: p.features }}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        {isService ? (
          <Link
            to="/booking"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm"
          >
            <CalendarCheck className="w-4 h-4" /> Đặt lịch ngay
          </Link>
        ) : (
          <>
            <button className="flex-1 flex items-center justify-center gap-2 border-2 border-emerald-600 text-emerald-700 font-semibold py-2.5 rounded-xl text-sm">
              <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
            </button>
            <Link
              to="/app/store/checkout"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm text-center"
            >
              Mua ngay
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
