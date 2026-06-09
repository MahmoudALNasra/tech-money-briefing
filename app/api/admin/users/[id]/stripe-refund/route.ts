import { NextResponse } from "next/server";

import { getAdminFromRequest, requireAdminConfigured } from "@/lib/admin-auth";
import { refundStripePurchase } from "@/lib/admin-credits";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    requireAdminConfigured();
    const admin = await getAdminFromRequest(request);

    if (!admin) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      ledgerEntryId?: unknown;
      creditsToDebit?: unknown;
      reason?: unknown;
    };
    const ledgerEntryId = String(body.ledgerEntryId ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const creditsToDebit =
      body.creditsToDebit === undefined || body.creditsToDebit === null
        ? undefined
        : Number(body.creditsToDebit);

    if (!ledgerEntryId) {
      return NextResponse.json({ error: "Missing ledger entry id." }, { status: 400 });
    }

    if (creditsToDebit !== undefined && (!Number.isFinite(creditsToDebit) || creditsToDebit < 0)) {
      return NextResponse.json({ error: "Credits to debit must be zero or greater." }, { status: 400 });
    }

    const result = await refundStripePurchase({
      adminUserId: admin.id,
      targetUserId: id,
      ledgerEntryId,
      creditsToDebit,
      reason: reason || undefined
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
