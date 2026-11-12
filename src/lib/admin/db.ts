import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Sunucuya özel istemci: gizli anahtar RLS'yi aşar. Sadece oturum doğrulandıktan sonra kullanılır.
let client: SupabaseClient | undefined;

export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Eksik ortam değişkeni: SUPABASE_SECRET_KEY");
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
