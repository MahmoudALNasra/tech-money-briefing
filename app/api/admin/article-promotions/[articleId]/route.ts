import { NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import {
  getArticlePromotionDetail,
  setArticlePromotionPosted
} from "@/lib/article-promotions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = await context.params;

  try {
    const detail = await getArticlePromotionDetail(articleId);

    if (!detail) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({ article: detail });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load article promotion."
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getAdminFromRequest(request);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId } = await context.params;
  const body = (await request.json()) as {
    platform?: string;
    published?: boolean;
  };

  const platform = body.platform === "instagram" ? "instagram" : "linkedin";
  const published = body.published !== false;

  try {
    const article = await setArticlePromotionPosted({
      articleId,
      platform,
      published
    });

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update article promotion."
      },
      { status: 500 }
    );
  }
}
