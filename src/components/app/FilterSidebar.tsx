import { X, Star } from "lucide-react";
import { useState } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/catalogCategories";

export interface AppStoreFilters {
  priceMin: string;
  priceMax: string;
  productCats: string[];
  serviceCats: string[];
  rating: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  serviceCategories?: string[];
  value?: AppStoreFilters;
  onApply?: (v: AppStoreFilters) => void;
}

const DEFAULT: AppStoreFilters = {
  priceMin: "",
  priceMax: "",
  productCats: [],
  serviceCats: [],
  rating: null,
};

const RATINGS = [5, 4, 3];

export function FilterSidebar({
  open,
  onClose,
  serviceCategories = [],
  value,
  onApply,
}: Props) {
  const [state, setState] = useState<AppStoreFilters>(value ?? DEFAULT);

  const toggle = (list: "productCats" | "serviceCats", key: string) =>
    setState((prev) => ({
      ...prev,
      [list]: prev[list].includes(key)
        ? prev[list].filter((c) => c !== key)
        : [...prev[list], key],
    }));

  const reset = () => setState(DEFAULT);

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
        className={`fixed top-0 right-0 z-[70] h-full w-[85%] max-w-[380px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
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

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Price */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Khoảng giá
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={state.priceMin}
                onChange={(e) =>
                  setState((p) => ({ ...p, priceMin: e.target.value }))
                }
                placeholder="Giá tối thiểu"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                value={state.priceMax}
                onChange={(e) =>
                  setState((p) => ({ ...p, priceMax: e.target.value }))
                }
                placeholder="Giá tối đa"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </section>

          {/* Product categories */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Danh mục Sản phẩm
              </h3>
            </div>
            <div className="space-y-1 rounded-xl bg-blue-50/60 p-2">
              {PRODUCT_CATEGORIES.map((c) => {
                const checked = state.productCats.includes(c.key);
                return (
                  <label
                    key={c.key}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle("productCats", c.key)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                    />
                    <span className="text-sm text-gray-700">{c.label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Service categories */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Danh mục Dịch vụ
              </h3>
            </div>
            <div className="space-y-1 rounded-xl bg-emerald-50/60 p-2">
              {serviceCategories.length === 0 ? (
                <p className="text-xs text-gray-500 italic px-2 py-1.5">
                  Chưa có danh mục dịch vụ
                </p>
              ) : (
                serviceCategories.map((c) => {
                  const checked = state.serviceCats.includes(c);
                  return (
                    <label
                      key={c}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle("serviceCats", c)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
                      />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          {/* Ratings */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Đánh giá
            </h3>
            <div className="space-y-2">
              {RATINGS.map((r) => {
                const active = state.rating === r;
                return (
                  <button
                    key={r}
                    onClick={() =>
                      setState((p) => ({ ...p, rating: active ? null : r }))
                    }
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

        <footer className="shrink-0 border-t border-gray-100 px-4 py-3 flex gap-2 bg-white">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Thiết lập lại
          </button>
          <button
            onClick={() => {
              onApply?.(state);
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
