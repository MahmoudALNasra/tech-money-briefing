import { NextRequest, NextResponse } from "next/server";

import { getPaginatedHomepageArticles } from "@/lib/articles";
import { parsePageParam } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const page = parsePageParam(request.nextUrl.searchParams.get("page") ?? undefined);
  const paginatedArticles = await getPaginatedHomepageArticles(page);

  return NextResponse.json({
    articles: paginatedArticles.articles,
    page: paginatedArticles.page,
    totalPages: paginatedArticles.totalPages,
    hasNextPage: paginatedArticles.hasNextPage
  });
}
