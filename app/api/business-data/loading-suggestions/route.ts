import { NextResponse } from "next/server";

import { getBusinessDataLoadingSuggestions } from "@/lib/business-data-loading-suggestions";

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = cleanText(searchParams.get("category"), 60);
    const location = cleanText(searchParams.get("location"), 140);

    if (!category) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await getBusinessDataLoadingSuggestions({
      category,
      location,
      limit: 8
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), suggestions: [] },
      { status: 500 }
    );
  }
}
