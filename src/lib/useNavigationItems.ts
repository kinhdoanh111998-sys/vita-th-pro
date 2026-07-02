import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export type NavigationPlatform = "homepage" | "app";

export type NavigationItem = {
  id: string;
  platform: NavigationPlatform;
  menu_key: string;
  label: string;
  route: string;
  is_visible: boolean;
  sort_order: number;
};

export function useNavigationItems(platform: NavigationPlatform) {
  return useQuery({
    queryKey: ["navigation_items", platform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .eq("platform", platform)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NavigationItem[];
    },
    staleTime: 60_000,
  });
}

export function useAllNavigationItems() {
  return useQuery({
    queryKey: ["navigation_items", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .order("platform")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as NavigationItem[];
    },
  });
}
