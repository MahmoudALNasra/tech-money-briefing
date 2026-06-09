import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { formatAuthProviderLabel } from "@/lib/auth-oauth-providers";
import { getSupabaseClient } from "@/lib/supabase";

function resolveUserAuthProvider(user: User) {
  const appProvider = String(user.app_metadata?.provider ?? "").trim();
  if (appProvider && appProvider !== "email") {
    return appProvider;
  }

  const oauthIdentity = user.identities?.find((identity) => identity.provider !== "email");
  return oauthIdentity?.provider ?? "email";
}

async function findUserByEmail(email: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server verification checks need SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const user = await findUserByEmail(email);
    const provider = user ? resolveUserAuthProvider(user) : null;

    return NextResponse.json({
      exists: Boolean(user),
      verified: Boolean(user?.email_confirmed_at),
      provider,
      providerLabel: provider ? formatAuthProviderLabel(provider) : null,
      usesOAuth: Boolean(provider && provider !== "email")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to check verification." },
      { status: 500 }
    );
  }
}
