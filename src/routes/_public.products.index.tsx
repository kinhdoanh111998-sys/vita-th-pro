import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { CategoryTabs } from "@/components/CategoryTabs";
import type { Product } from "@/lib/mockData";
import { supabase } from "@/lib/supabaseClient";

const fallbackImg =
  "https://vitath.pro/wp-content/uploads/2025/11/Frame-2-4.png";

const CATEGORIES = ["Tất cả", "Máy công nghệ", "Phụ kiện", "Dịch vụ", "Chuyển giao công nghệ"];

type Search = { category?: string };

export const Route = createFileRoute("/_public/products/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { category } = Route.useSearch();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("catalog")
      .select("*")
      .eq("status", "Hiển thị")
      .then(({ data }) => {
        const rows = (data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          type: (r.type as string) ?? "",
          name: (r.name as string) ?? "",
          price: Number(r.price ?? 0),
          summary: (r.summary as string) ?? "",
          status: (r.status as string) ?? "",
          image: (r.image as string) || fallbackImg,
          source: (r.source as string) ?? "",
        }));
        setItems(rows);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () => (category ? items.filter((p) => p.type === category) : items),
    [items, category],
  );

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1180px] px-5">
        <h1 className="text-3xl lg:text-[34px] font-black tracking-tight text-brand-dark">
          Sản phẩm & Dịch vụ
        </h1>
        <p className="text-ink-muted mt-2 max-w-[620px]">
          Toàn bộ danh mục máy công nghệ và gói dịch vụ của Vita TH Pro.
        </p>
        <CategoryTabs to="/products" categories={CATEGORIES} current={category} />
        <div className="mt-8">
          {loading ? (
            <p className="text-ink-muted">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="text-ink-muted">Chưa có sản phẩm phù hợp.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
