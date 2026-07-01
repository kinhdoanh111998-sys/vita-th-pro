import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { ProductCard, type StoreProduct } from "@/components/app/ProductCard";

const MOCK_PRODUCTS: StoreProduct[] = [
  { id: 1, name: "Máy VITA M01", price: "15.000.000đ", category: "Máy móc", image: "https://placehold.co/300x300/png" },
  { id: 2, name: "Serum Phục Hồi", price: "850.000đ", category: "Mỹ phẩm", image: "https://placehold.co/300x300/png" },
  { id: 3, name: "Máy VITA M04", price: "22.000.000đ", category: "Máy móc", image: "https://placehold.co/300x300/png" },
  { id: 4, name: "Kem Chống Nắng", price: "450.000đ", category: "Mỹ phẩm", image: "https://placehold.co/300x300/png" },
  { id: 5, name: "VITA THPro Official", price: "160.000đ", category: "Sức khỏe", image: "https://placehold.co/300x300/png" },
  { id: 6, name: "VITA THPro Official", price: "160.000đ", category: "Sức khỏe", image: "https://placehold.co/300x300/png" },
];

const CATEGORIES = ["Tất cả", "Máy móc", "Mỹ phẩm", "Sức khỏe"];

function StorePage() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchCat = activeCategory === "Tất cả" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Search + Filter */}
      <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-100">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm cửa hàng"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
          <button className="flex items-center gap-1 bg-white rounded-full px-4 py-2.5 shadow-sm border border-gray-100 text-sm text-gray-700">
            Filter <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-16">Không tìm thấy sản phẩm</div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/app/store")({
  component: StorePage,
});
