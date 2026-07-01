import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Settings = {
  id: number;
  brand: string | null;
  tagline: string | null;
  hotline: string | null;
  zalo: string | null;
  email: string | null;
  address: string | null;
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("hotline,zalo_link")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("[settings] system settings unavailable:", error.message);
      }

      return {
        id: 1,
        brand: "Vita TH Pro",
        tagline: "Theo dõi tiến độ trị liệu",
        hotline: data?.hotline ?? "0988 000 888",
        zalo: data?.zalo_link ?? null,
        email: null,
        address: null,
      } satisfies Settings;
    },
    staleTime: 60_000,
    retry: false,
  });
}
