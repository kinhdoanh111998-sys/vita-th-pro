import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

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
        .from("settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Settings | null;
    },
    staleTime: 60_000,
  });
}
