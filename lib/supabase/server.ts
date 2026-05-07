import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

export function createServerSupabase() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
