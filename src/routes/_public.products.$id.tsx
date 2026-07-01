import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CatalogDetailLayout } from "@/components/CatalogDetailLayout";
import type { CatalogItem } from "@/lib/useServiceCatalog";

export const Route = createFileRoute("/_public/products/$id")({
  component: ProductDetailPage,
});

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
    short_description: (r.short_description as string) ?? null,
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
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["catalog", "detail", id],
    queryFn: () => fetchItem(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 grid md:grid-cols-2 gap-8 animate-pulse">
        <div className="aspect-square bg-white rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 w-24 bg-white rounded" />
          <div className="h-10 w-3/4 bg-white rounded" />
          <div className="h-8 w-1/2 bg-white rounded" />
          <div className="h-24 w-full bg-white rounded" />
          <div className="h-12 w-full bg-white rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold mb-3">
          Không tìm thấy sản phẩm
        </h2>
        <p className="text-brand-muted mb-6">
          {error ? (error as Error).message : "Sản phẩm không tồn tại hoặc đã bị gỡ."}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-brand-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <CatalogDetailLayout
      item={data}
      crumbHref="/products"
      crumbLabel="Sản phẩm"
    />
  );
}
