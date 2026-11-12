import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

// Ziyaretçi tarafı: sadece okur. Yetkiler veritabanındaki RLS kurallarıyla sınırlıdır.
let client: SupabaseClient | undefined;

export function getPublicSupabase(): SupabaseClient {
  client ??= createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
