import { NextResponse } from "next/server";

import { BUSINESS_DATA_CATEGORY_VALUES } from "@/lib/business-data-categories";
import { getUserFromRequest } from "@/lib/business-data-auth";
import {
  buildExportMeta,
  clampRadius,
  cleanText,
  getExportLimit,
  getGooglePlacesKey,
  nearbySearchAll,
  processPlacesBatch,
  resolveSearchCenter,
  toCsv
} from "@/lib/business-data-export-core";
import { enforceBusinessDataSecurity } from "@/lib/business-data-security";
import {
  BUSINESS_DATA_REPORT_LIMITS,
  clampBusinessDataReportLimit,
  debitTokens,
  ESTIMATED_COSTS_USD,
  getBusinessDataExportTokenCost,
  getWalletBalance,
  logUsageEvent
} from "@/lib/business-data-tokens";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const turnstileToken = cleanText(body.turnstileToken, 4000);
    const responseFormat = cleanText(body.format, 20).toLowerCase() === "json" ? "json" : "csv";

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
    const radiusMeters = clampRadius(body.radiusMeters);
    const maxExportLimit = getExportLimit();
    const limit = Math.min(clampBusinessDataReportLimit(body.resultLimit), maxExportLimit);
    const maxCredits = getBusinessDataExportTokenCost(limit);

    const balance = await getWalletBalance(user.id);

    if (balance < maxCredits) {
      return NextResponse.json(
        {
          error: `Not enough credits. This ${limit}-business report needs up to ${maxCredits} credits.`,
          balance,
          required: maxCredits
        },
        { status: 402 }
      );
    }

    if (!BUSINESS_DATA_CATEGORY_VALUES.has(category)) {
      return badRequest("Choose a supported business category.");
    }

    const center = await resolveSearchCenter({ body, location, apiKey });
    const places = await nearbySearchAll({
      apiKey,
      lat: center.lat,
      lng: center.lng,
      category,
      radiusMeters,
      limit
    });

    if (places.length === 0) {
      return NextResponse.json(
        {
          error:
            "No businesses were found for this subscriber report. Try running a fresh search with a larger radius before exporting."
        },
        { status: 404 }
      );
    }

    const { rows } = await processPlacesBatch({
      places,
      startIndex: 0,
      batchSize: places.length,
      category,
      apiKey
    });
    const csv = toCsv(rows);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "The subscriber report did not contain any business rows. Try running a fresh search before exporting."
        },
        { status: 404 }
      );
    }

    const creditsToCharge = rows.length;
    const debit = await debitTokens({
      userId: user.id,
      amount: creditsToCharge,
      reason: "full_export",
      metadata: {
        category,
        location,
        requested_limit: limit,
        row_count: rows.length
      }
    });

    if (!debit.ok) {
      return NextResponse.json(
        { error: "Not enough credits to complete export.", balance: debit.balance },
        { status: 402 }
      );
    }

    await logUsageEvent({
      userId: user.id,
      eventType: "full_export",
      tokensCharged: creditsToCharge,
      estimatedCostUsd:
        ESTIMATED_COSTS_USD.fullExport * (Math.max(rows.length, 1) / BUSINESS_DATA_REPORT_LIMITS.max),
      metadata: {
        category,
        location,
        requested_limit: limit,
        row_count: rows.length,
        balance_after: debit.balance
      }
    });

    const meta = buildExportMeta(rows, debit.balance, creditsToCharge);

    if (responseFormat === "json") {
      return NextResponse.json({
        csv,
        rows,
        ...meta
      });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="business-data-export-${Date.now()}.csv"`,
        "Cache-Control": "private, max-age=300",
        "X-Export-Rows": String(rows.length),
        "X-Export-Emails-Found": String(meta.emailsFound),
        "X-Export-Pitches-Generated": String(meta.pitchesGenerated),
        "X-Tokens-Charged": String(creditsToCharge),
        "X-Credits-Charged": String(creditsToCharge),
        "X-Token-Balance": String(debit.balance)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
