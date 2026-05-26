import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
  }

  if (!supabaseAnonKey && !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }

  cachedClient = createClient(
    supabaseUrl,
    supabaseServiceRoleKey ?? supabaseAnonKey!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  return cachedClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, client);

    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  }
});
