import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { listSocialPostDrafts } from "@/lib/social-drafts/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drafts = await listSocialPostDrafts(30);
    return NextResponse.json({ drafts });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load social drafts."
      },
      { status: 500 }
    );
  }
}
