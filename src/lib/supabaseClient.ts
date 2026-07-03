import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";

export const supabase = cloudSupabase as SupabaseClient<any, "public", any>;
