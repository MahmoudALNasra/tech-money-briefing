import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { listArticlePromotionsByCategory } from "@/lib/article-promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await listArticlePromotionsByCategory();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load article promotions."
      },
      { status: 500 }
    );
  }
}
