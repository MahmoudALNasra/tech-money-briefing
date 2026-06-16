import { NextResponse } from "next/server";

import { BUSINESS_DATA_CATEGORY_VALUES } from "@/lib/business-data-categories";
import { getUserFromRequest } from "@/lib/business-data-auth";
import { clampRadius, cleanText, getGooglePlacesKey } from "@/lib/business-data-export-core";
import { runSampleEnrich } from "@/lib/business-data-sample-enrich";
import { enforceBusinessDataSecurity } from "@/lib/business-data-security";

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
        { error: "Sign in required to run Sample Enrich." },
        { status: 401 }
      );
    }

    const apiKey = getGooglePlacesKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Google Places is not configured." }, { status: 503 });
    }

    const location = cleanText(body.location, 140);
    const category = cleanText(body.category, 60);
    const radiusMeters = clampRadius(body.radiusMeters);

    if (!BUSINESS_DATA_CATEGORY_VALUES.has(category)) {
      return NextResponse.json({ error: "Choose a supported business category." }, { status: 400 });
    }

    const result = await runSampleEnrich({
      userId: user.id,
      body,
      apiKey,
      location,
      category,
      radiusMeters
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          balance: result.balance,
          required: result.required
        },
        { status: result.error?.includes("Not enough credits") ? 402 : 400 }
      );
    }

    return NextResponse.json({
      rows: result.previewRows,
      exportRows: result.rows,
      chargedPlaceIds: result.chargedPlaceIds,
      creditsCharged: result.creditsCharged,
      balance: result.balance,
      sampleSize: result.sampleSize
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
