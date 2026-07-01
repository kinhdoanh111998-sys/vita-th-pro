import { MapPin, Phone, Globe, QrCode, Tag, Navigation, PhoneCall, Share2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface StoreProduct {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  rating?: number;
  domain?: string;
  distance?: string;
  phone?: string;
  description?: string;
  pinned?: boolean;
}

interface ProductCardProps {
  product: StoreProduct;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const {
    name,
    price,
    category,
    image,
    rating = 4.9,
    domain = "vitath.pro",
    distance = "0.5km",
    phone = "0900000111",
    description = "Cửa hàng tiêu biểu được ghim đầu danh sách. Website dùng domain vitath.pro, giao dịch vẫn quản lý bởi VITA.",
    pinned = true,
  } = product;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Image */}
      <Link
        to="/app/store/$productId"
        params={{ productId: String(product.id) }}
        className="relative aspect-square bg-gray-100 block"
      >
        <img src={image} alt={name} className="w-full h-full object-cover" />
        {pinned && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
            📌 Ghim đầu
          </span>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className="bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            ★ {rating}
          </span>
          <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
            {category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <h3 className={`font-bold text-gray-900 leading-tight ${compact ? "text-sm" : "text-sm text-center"}`}>
          {name}
        </h3>

        {compact ? (
          <div className="text-xs text-blue-600 font-medium">{domain}</div>
        ) : null}

        <div className="text-xs">
          <span className="text-gray-600">Dự kiến: </span>
          <span className="text-orange-500 font-bold">{price}</span>
        </div>

        {!compact && (
          <p className="text-xs text-gray-600 leading-snug line-clamp-3">{description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-green-600 mt-1">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{distance}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-500">
            <Globe className="w-3.5 h-3.5" />
            <QrCode className="w-3.5 h-3.5 text-orange-500" />
            <Tag className="w-3.5 h-3.5 text-orange-400" />
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-green-600">
          <Phone className="w-3 h-3" />
          <span>{phone}</span>
        </div>

        {/* CTA */}
        <div className={`grid ${compact ? "grid-cols-2 gap-1.5" : "grid-cols-1 gap-1.5"} mt-1.5`}>
          <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 rounded-md">
            Chi tiết
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-md">
            Thanh toán
          </button>
        </div>

        {!compact && (
          <div className="flex items-center justify-around pt-2 mt-1 border-t border-gray-100 text-green-600">
            <Navigation className="w-4 h-4" />
            <PhoneCall className="w-4 h-4" />
            <Globe className="w-4 h-4" />
            <Share2 className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
