import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/auth-verification-email";
import { getSupabaseClient } from "@/lib/supabase";

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

function getSafeNextPath(value: unknown) {
  const nextPath = String(value ?? "/profile");
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/profile";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; next?: unknown };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const nextPath = getSafeNextPath(body.next);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Server verification email settings are missing." },
        { status: 500 }
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "No account exists for this email yet." },
        { status: 404 }
      );
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: "This email is already verified. Sign in instead." },
        { status: 409 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      request.headers.get("origin") ??
      new URL(request.url).origin;
    const redirectTo = `${origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const supabase = getSupabaseClient();
    const linkResult = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo
      }
    });

    if (linkResult.data.properties?.action_link) {
      await sendVerificationEmail({
        to: email,
        verificationUrl: linkResult.data.properties.action_link
      });

      return NextResponse.json({ ok: true });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await anonClient.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resend verification email." },
      { status: 500 }
    );
  }
}
