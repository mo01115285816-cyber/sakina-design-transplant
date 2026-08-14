import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getServerConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function getSupabaseServerClient(): SupabaseClient | null {
  if (client) return client;
  const config = getServerConfig();
  if (!config) return null;

  client = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}

export function isSupabaseServerConfigured(): boolean {
  return Boolean(getServerConfig());
}
