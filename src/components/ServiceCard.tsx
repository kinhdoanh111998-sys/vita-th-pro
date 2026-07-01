import { Link } from "@tanstack/react-router";
import { ImageIcon, Sparkles } from "lucide-react";
import {
  formatVND,
  pickImage,
  type CatalogItem,
} from "@/lib/useServiceCatalog";

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
  const ctaLabel = isService ? "Đăng ký liệu trình" : "Đặt mua ngay";

  const linkProps =
    linkTo === "app"
      ? { to: "/app/store/$productId" as const, params: { productId: item.id } }
      : { to: "/products/$id" as const, params: { id: item.id } };

  const compact = variant === "app";

  return (
    <Link
      {...linkProps}
      className={
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md " +
        (compact ? "" : "")
      }
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-white overflow-hidden">
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

        {/* Sale badge */}
        {hasSale && (
          <span className="absolute top-2 right-2 rounded-full bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 shadow">
            -
            {Math.round(
              (1 - (item.sale_price as number) / (item.price as number)) * 100,
            )}
            %
          </span>
        )}

        {/* Type badge */}
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
      </div>

      {/* Content */}
      <div
        className={
          "flex flex-1 flex-col gap-1.5 " + (compact ? "p-2.5" : "p-4")
        }
      >
        <h3
          className={
            "font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors " +
            (compact ? "text-sm" : "text-[15px]")
          }
        >
          {item.name}
        </h3>

        {!compact && item.description && (
          <p className="text-xs text-gray-500 line-clamp-2">
            {item.description}
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

        {!compact && (
          <span className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors group-hover:bg-emerald-700">
            {ctaLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
