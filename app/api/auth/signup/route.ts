import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/auth-verification-email";
import { getSupabaseClient } from "@/lib/supabase";

function getSafeNextPath(value: unknown) {
  const nextPath = String(value ?? "/profile");
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/profile";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      next?: unknown;
    };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const nextPath = getSafeNextPath(body.next);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      request.headers.get("origin") ??
      new URL(request.url).origin;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: `${origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    });

    if (error || !data.properties?.action_link) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create a verification link." },
        { status: 400 }
      );
    }

    await sendVerificationEmail({
      to: email,
      verificationUrl: data.properties.action_link
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 500 }
    );
  }
}
