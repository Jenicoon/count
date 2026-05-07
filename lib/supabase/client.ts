"use client";

import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | undefined;

export function getBrowserSupabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Supabase public env is missing.");
    }

    client = createClient(url, key);
  }

  return client;
}
