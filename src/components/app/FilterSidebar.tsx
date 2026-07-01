import { X, Star } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply?: () => void;
}

const CATEGORIES = [
  "Thiết bị spa",
  "Mỹ phẩm trị liệu",
  "Phụ kiện tiêu hao",
  "Thực phẩm chức năng",
  "Dụng cụ hỗ trợ",
];

const RATINGS = [5, 4, 3];

export function FilterSidebar({ open, onClose, onApply }: Props) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [checkedCats, setCheckedCats] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const toggleCat = (cat: string) =>
    setCheckedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const reset = () => {
    setMinPrice("");
    setMaxPrice("");
    setCheckedCats([]);
    setSelectedRating(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-[85%] max-w-[360px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-heading font-bold text-gray-900">
            Bộ lọc tìm kiếm
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng bộ lọc"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </header>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Price Range */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Khoảng giá
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Giá tối thiểu"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Giá tối đa"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Danh mục
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => {
                const checked = checkedCats.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center gap-3 py-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCat(cat)}
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Ratings */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Đánh giá
            </h3>
            <div className="space-y-2">
              {RATINGS.map((r) => {
                const active = selectedRating === r;
                return (
                  <button
                    key={r}
                    onClick={() => setSelectedRating(active ? null : r)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                      active
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < r
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-700">
                      {r === 5 ? "5 sao" : `${r} sao trở lên`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <footer className="shrink-0 border-t border-gray-100 px-4 py-3 flex gap-2 bg-white">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Thiết lập lại
          </button>
          <button
            onClick={() => {
              onApply?.();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-sm hover:bg-amber-600"
          >
            Áp dụng
          </button>
        </footer>
      </aside>
    </>
  );
}
