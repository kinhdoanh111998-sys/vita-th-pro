import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type Store = {
  id: string;
  name: string;
  images: string[];
  main_image: string | null;
  address: string | null;
  phone: string | null;
  hotline: string | null;
  email: string | null;
  open_hours: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function useActiveStores() {
  return useQuery({
    queryKey: ["stores", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Store[];
    },
    staleTime: 60_000,
  });
}

export function useAllStores() {
  return useQuery({
    queryKey: ["stores", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Store[];
    },
  });
}
