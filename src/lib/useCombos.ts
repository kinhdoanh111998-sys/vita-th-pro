import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type ComboItemRef = {
  service_id: string;
  quantity: number;
  service: {
    id: string;
    name: string;
    type: "product" | "service";
    price: number | null;
    sale_price: number | null;
    image_url: string | null;
    image_urls: string[] | null;
    is_hidden: boolean | null;
  };
};

export type Combo = {
  id: string;
  name: string;
  headline: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  is_hidden: boolean;
  created_at: string;
  items: ComboItemRef[];
  hasProduct: boolean;
  hasService: boolean;
  basePrice: number;
  finalPrice: number;
  savedAmount: number;
};

const priceOf = (s: ComboItemRef["service"]) =>
  s.sale_price && s.sale_price > 0
    ? Number(s.sale_price)
    : s.price
      ? Number(s.price)
      : 0;

function decorate(row: Record<string, unknown>): Combo {
  const items: ComboItemRef[] = Array.isArray(row.items)
    ? (row.items as Record<string, unknown>[]).map((it) => {
        const svc = (it.service ?? {}) as Record<string, unknown>;
        return {
          service_id: String(it.service_id),
          quantity: Number(it.quantity ?? 1),
          service: {
            id: String(svc.id ?? it.service_id),
            name: String(svc.name ?? ""),
            type: svc.type === "product" ? "product" : "service",
            price: svc.price != null ? Number(svc.price) : null,
            sale_price: svc.sale_price != null ? Number(svc.sale_price) : null,
            image_url: (svc.image_url as string) ?? null,
            image_urls: Array.isArray(svc.image_urls)
              ? ((svc.image_urls as unknown[]).filter(
                  (x) => typeof x === "string",
                ) as string[])
              : null,
            is_hidden: svc.is_hidden as boolean | null,
          },
        };
      })
    : [];

  const visibleItems = items.filter((i) => !i.service.is_hidden);
  const hasProduct = visibleItems.some((i) => i.service.type === "product");
  const hasService = visibleItems.some((i) => i.service.type === "service");
  const basePrice = visibleItems.reduce(
    (sum, i) => sum + priceOf(i.service) * i.quantity,
    0,
  );

  const dType = row.discount_type === "amount" ? "amount" : "percent";
  const dVal = Number(row.discount_value ?? 0);
  let finalPrice = basePrice;
  if (dType === "percent") {
    finalPrice = Math.max(0, Math.round(basePrice * (1 - dVal / 100)));
  } else {
    finalPrice = Math.max(0, Math.round(basePrice - dVal));
  }

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    headline: (row.headline as string) ?? null,
    subtitle: (row.subtitle as string) ?? null,
    description: (row.description as string) ?? null,
    image_url: (row.image_url as string) ?? null,
    discount_type: dType,
    discount_value: dVal,
    is_hidden: Boolean(row.is_hidden),
    created_at: String(row.created_at ?? ""),
    items: visibleItems,
    hasProduct,
    hasService,
    basePrice,
    finalPrice,
    savedAmount: Math.max(0, basePrice - finalPrice),
  };
}

const SELECT_QUERY = `
  id, name, headline, subtitle, description, image_url,
  discount_type, discount_value, is_hidden, created_at, updated_at,
  items:combo_items(
    service_id, quantity,
    service:services(id, name, type, price, sale_price, image_url, image_urls, is_hidden)
  )
`;

export function usePublicCombos() {
  return useQuery<Combo[]>({
    queryKey: ["combos", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combos")
        .select(SELECT_QUERY)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => decorate(r as Record<string, unknown>));
    },
    staleTime: 60_000,
  });
}

export function useAdminCombos() {
  return useQuery<Combo[]>({
    queryKey: ["combos", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combos")
        .select(SELECT_QUERY)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => decorate(r as Record<string, unknown>));
    },
    staleTime: 15_000,
  });
}

export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
