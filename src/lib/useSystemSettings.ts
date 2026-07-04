import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SystemSettings = {
  id: string;
  hotline: string | null;
  zalo_link: string | null;
  facebook_link: string | null;
  updated_at: string;
  show_store_list: boolean;
  zalo_oa_url: string | null;
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

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SystemSettings>) => {
      // Lấy row hiện tại (nếu có), update — nếu chưa có thì insert.
      const { data: existing } = await supabase
        .from("system_settings")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase
          .from("system_settings")
          .update(patch)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("system_settings")
          .insert(patch);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SYSTEM_SETTINGS_KEY }),
  });
}
