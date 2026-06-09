import { NextResponse } from "next/server";

import { getAdminAccessDenial, requireAdminConfigured } from "@/lib/admin-auth";
import { getUserFromRequest } from "@/lib/business-data-auth";
import { listAdminUsers } from "@/lib/admin-credits";

export async function GET(request: Request) {
  try {
    requireAdminConfigured();
    const user = await getUserFromRequest(request);
    const denial = getAdminAccessDenial(user, request);

    if (denial === "unauthenticated") {
      return NextResponse.json({ error: "Sign in required.", reason: denial }, { status: 401 });
    }

    if (denial === "email_not_authorized") {
      return NextResponse.json(
        {
          error:
            "This signed-in email is not listed in ADMIN_EMAILS. Add it to your environment configuration and redeploy.",
          reason: denial,
          email: user?.email ?? null
        },
        { status: 403 }
      );
    }

    if (denial === "mfa_required") {
      return NextResponse.json(
        { error: "Authenticator verification is required.", reason: denial },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = Number(searchParams.get("limit") ?? "100");

    const users = await listAdminUsers({ query, limit });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
