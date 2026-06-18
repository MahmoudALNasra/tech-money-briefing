import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { markSocialDraftPosted } from "@/lib/social-drafts/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { platform?: string };
  const platform = body.platform === "instagram" ? "instagram" : "linkedin";

  try {
    const draft = await markSocialDraftPosted({ id, platform });
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update draft."
      },
      { status: 500 }
    );
  }
}
