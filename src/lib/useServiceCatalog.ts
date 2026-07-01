import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  features: string | null;
  short_description: string | null;
  price: number | null;
  sale_price: number | null;
  default_sessions: number | null;
  image_url: string | null;
  image_urls: string[] | null;
  sku: string | null;
  type: "product" | "service";
  category: string | null;
  stock_quantity: number | null;
};

export function useServiceCatalog() {
  return useQuery<CatalogItem[]>({
    queryKey: ["catalog", "services_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services_public")
        .select("*")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ""),
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
        type: ((r.type as string) === "product" ? "product" : "service") as
          | "product"
          | "service",
        category: (r.category as string) ?? null,
        stock_quantity:
          r.stock_quantity != null ? Number(r.stock_quantity) : null,
      }));
    },
    staleTime: 60_000,
  });
}

export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";

export function pickImage(item: CatalogItem): string | null {
  if (item.image_urls && item.image_urls.length > 0) return item.image_urls[0];
  if (item.image_url) return item.image_url;
  return null;
}
