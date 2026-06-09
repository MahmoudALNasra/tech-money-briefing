import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import { enforceBusinessDataSecurity } from "@/lib/business-data-security";
import {
  debitTokens,
  ESTIMATED_COSTS_USD,
  logUsageEvent,
  TOKEN_COSTS
} from "@/lib/business-data-tokens";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { fromCache?: boolean };
    const security = await enforceBusinessDataSecurity({
      request,
      action: "checkout"
    });

    if (!security.ok) {
      return NextResponse.json({ error: security.error }, { status: security.status });
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const fromCache = Boolean(body.fromCache);

    if (fromCache) {
      const debit = await debitTokens({
        userId: user.id,
        amount: TOKEN_COSTS.driveUpload,
        reason: "drive_upload_cached",
        metadata: { from_cache: true }
      });

      if (!debit.ok) {
        return NextResponse.json(
          { error: "Not enough tokens for Google Drive upload.", balance: debit.balance },
          { status: 402 }
        );
      }

      await logUsageEvent({
        userId: user.id,
        eventType: "drive_upload_cached",
        tokensCharged: TOKEN_COSTS.driveUpload,
        estimatedCostUsd: ESTIMATED_COSTS_USD.driveUpload,
        metadata: { from_cache: true, balance_after: debit.balance }
      });

      return NextResponse.json({
        ok: true,
        tokensCharged: TOKEN_COSTS.driveUpload,
        balance: debit.balance
      });
    }

    return NextResponse.json({ error: "Invalid drive charge request." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
