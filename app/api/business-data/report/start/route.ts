import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import { BUSINESS_DATA_CATEGORY_VALUES } from "@/lib/business-data-categories";
import { cleanText, getGooglePlacesKey } from "@/lib/business-data-export-core";
import { enforceBusinessDataSecurity } from "@/lib/business-data-security";
import {
  serializeReportJobStatus,
  startReportJob
} from "@/lib/business-data-report-jobs";
import { getWalletBalance } from "@/lib/business-data-tokens";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const turnstileToken = cleanText(body.turnstileToken, 4000);

    const security = await enforceBusinessDataSecurity({
      request,
      action: "export",
      turnstileToken: turnstileToken || null
    });

    if (!security.ok) {
      return NextResponse.json({ error: security.error }, { status: security.status });
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Sign in required to generate a subscriber report." },
        { status: 401 }
      );
    }

    const apiKey = getGooglePlacesKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });
    }

    const location = cleanText(body.location, 140);
    const category = cleanText(body.category, 60);
    const radiusMeters = Number(body.radiusMeters);
    const requestedCount = Number(body.resultLimit);
    const cacheKey = cleanText(body.cacheKey, 200);

    if (!BUSINESS_DATA_CATEGORY_VALUES.has(category)) {
      return NextResponse.json({ error: "Choose a supported business category." }, { status: 400 });
    }

    if (!cacheKey) {
      return NextResponse.json({ error: "A cache key is required." }, { status: 400 });
    }

    const result = await startReportJob({
      userId: user.id,
      body,
      apiKey,
      cacheKey,
      location,
      category,
      radiusMeters,
      requestedCount
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          balance: result.balance,
          required: result.required
        },
        { status: result.error?.includes("Not enough credits") ? 402 : 404 }
      );
    }

    const balance = await getWalletBalance(user.id);

    return NextResponse.json(serializeReportJobStatus(result.job, balance));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
