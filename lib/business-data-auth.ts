import { createClient } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function getUserFromRequest(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = bearerMatch?.[1]?.trim();

  if (!token) {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email
  };
}
