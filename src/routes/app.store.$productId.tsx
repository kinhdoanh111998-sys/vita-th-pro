import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Star, Heart, Share2, ShoppingCart, Minus, Plus } from "lucide-react";
import { useState } from "react";

const MOCK_PRODUCT = {
  id: 1,
  name: "Yến Mạch Hữu Cơ Organic Oats 500g",
  price: "85.000đ",
  oldPrice: "120.000đ",
  rating: 4.8,
  reviews: 312,
  sold: 1024,
  image: "https://placehold.co/600x600/png",
  badge: "Bán chạy",
  description:
    "Yến mạch hữu cơ nhập khẩu, giàu chất xơ và khoáng chất, hỗ trợ tim mạch và tiêu hóa. Sản phẩm được chọn lọc kỹ càng từ nông trại đạt chuẩn Organic, không chất bảo quản, phù hợp cho bữa sáng lành mạnh mỗi ngày.",
};

function ProductDetailPage() {
  const [qty, setQty] = useState(1);
  const p = MOCK_PRODUCT;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Image header */}
      <div className="relative bg-white">
        <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
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
        <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
          {p.badge}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white mt-2 p-4 space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-orange-500">{p.price}</span>
          <span className="text-sm text-gray-400 line-through">{p.oldPrice}</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 leading-snug">{p.name}</h1>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.round(p.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
              />
            ))}
            <span className="ml-1 font-semibold text-gray-700">{p.rating}</span>
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{p.reviews} đánh giá</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">Đã bán {p.sold}</span>
        </div>
      </div>

      {/* Quantity */}
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

      {/* Description */}
      <div className="bg-white mt-2 p-4 space-y-2">
        <h2 className="text-base font-bold text-gray-900">Mô tả sản phẩm</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        <button className="flex-1 flex items-center justify-center gap-2 border-2 border-green-600 text-green-700 font-semibold py-2.5 rounded-xl text-sm">
          <ShoppingCart className="w-4 h-4" />
          Thêm vào giỏ
        </button>
        <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm">
          Mua ngay
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/store/$productId")({
  component: ProductDetailPage,
});
