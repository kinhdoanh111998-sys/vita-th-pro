import { Link, useNavigate } from "@tanstack/react-router";
import { ImageIcon, Sparkles, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  formatVND,
  pickImage,
  type CatalogItem,
} from "@/lib/useServiceCatalog";
import { useCartStore } from "@/lib/cart/useCartStore";
import { ShareRefButton } from "@/components/ShareRefButton";

type Variant = "web" | "app";

interface ServiceCardProps {
  item: CatalogItem;
  variant?: Variant;
  linkTo?: "web" | "app";
}

export function ServiceCard({
  item,
  variant = "web",
  linkTo = "web",
}: ServiceCardProps) {
  const img = pickImage(item);
  const navigate = useNavigate();
  const add = useCartStore((s) => s.add);

  const hasSale =
    typeof item.sale_price === "number" &&
    item.sale_price > 0 &&
    typeof item.price === "number" &&
    item.price > item.sale_price;
  const showPrice =
    typeof item.sale_price === "number" && item.sale_price > 0
      ? item.sale_price
      : typeof item.price === "number" && item.price > 0
        ? item.price
        : null;

  const isService = item.type === "service";

  const detailProps =
    linkTo === "app"
      ? { to: "/app/store/$productId" as const, params: { productId: item.id } }
      : isService
        ? { to: "/services/$id" as const, params: { id: item.id } }
        : { to: "/products/$id" as const, params: { id: item.id } };

  // Share path — dùng public route (SEO + shareable)
  const sharePath = isService ? `/services/${item.id}` : `/products/${item.id}`;

  const compact = variant === "app";

  const addToCart = () => {
    if (!showPrice) {
      toast.info("Sản phẩm chưa có giá — vui lòng liên hệ.");
      return;
    }
    add({
      id: item.id,
      name: item.name,
      price: showPrice,
      image: img ?? null,
      type: isService ? "service" : "product",
    });
    toast.success("Đã thêm vào giỏ hàng");
  };

  const buyNow = () => {
    if (!showPrice) {
      toast.info("Sản phẩm chưa có giá — vui lòng liên hệ.");
      return;
    }
    add({
      id: item.id,
      name: item.name,
      price: showPrice,
      image: img ?? null,
      type: isService ? "service" : "product",
    });
    navigate({ to: "/checkout" });
  };

  return (
    <div
      className={
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md " +
        (compact ? "" : "")
      }
    >
      {/* Image → link to detail */}
      <Link
        {...detailProps}
        className="relative aspect-square bg-gradient-to-br from-emerald-50 to-white overflow-hidden block"
      >
        {img ? (
          <img
            src={img}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-300">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}

        {hasSale && (
          <span className="absolute top-2 right-14 rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 shadow">
            -
            {Math.round(
              (1 - (item.sale_price as number) / (item.price as number)) * 100,
            )}
            %
          </span>
        )}

        {isService ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
            <Sparkles className="w-3 h-3" />
            Liệu trình
            {item.default_sessions ? `: ${item.default_sessions} buổi` : ""}
          </span>
        ) : (
          <span className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm">
            Sản phẩm
          </span>
        )}
      </Link>

      {/* Floating share icon on top-right of image — only on desktop/web cards */}
      {!compact && (
        <div className="absolute top-2 right-2 z-10">
          <ShareRefButton path={sharePath} iconOnly />
        </div>
      )}

      {/* Content */}
      <div className={"flex flex-1 flex-col gap-1.5 " + (compact ? "p-2.5" : "p-4")}>
        <Link
          {...detailProps}
          className={
            "font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors " +
            (compact ? "text-sm" : "text-[15px]")
          }
        >
          {item.name}
        </Link>

        {!compact && item.description && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {item.description.replace(/<[^>]+>/g, " ").trim()}
          </p>
        )}

        <div className="mt-auto pt-1.5">
          {showPrice != null ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span
                className={
                  "font-bold text-rose-600 " +
                  (compact ? "text-[15px]" : "text-lg")
                }
              >
                {formatVND(showPrice)}
              </span>
              {hasSale && (
                <span className="text-xs text-gray-400 line-through">
                  {formatVND(item.price as number)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500 italic">Liên hệ báo giá</span>
          )}
        </div>

        {/* CTA row: cart + share (mobile app) + buy now */}
        <div className="mt-3 flex items-stretch gap-2">
          <button
            type="button"
            onClick={addToCart}
            aria-label="Thêm vào giỏ"
            className="shrink-0 w-10 h-10 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 grid place-items-center transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          {compact && (
            <ShareRefButton
              path={sharePath}
              iconOnly
              className="shrink-0 w-10 h-10 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-white shadow-none"
            />
          )}
          <button
            type="button"
            onClick={buyNow}
            className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}
