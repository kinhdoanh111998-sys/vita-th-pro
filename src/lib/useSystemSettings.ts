import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SystemSettings = {
  id: string;
  hotline: string | null;
  zalo_link: string | null;
  facebook_link: string | null;
  updated_at: string;
};

export const SYSTEM_SETTINGS_KEY = ["system_settings"] as const;

export function useSystemSettings() {
  return useQuery({
    queryKey: SYSTEM_SETTINGS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as SystemSettings | null;
    },
    staleTime: 30_000,
  });
}
