import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL");
}

if (!supabaseAnonKey && !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey ?? supabaseAnonKey!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
