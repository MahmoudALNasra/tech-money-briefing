import { NextResponse } from "next/server";

import { getAdminFromRequest, requireAdminConfigured } from "@/lib/admin-auth";
import { adjustUserCredits } from "@/lib/admin-credits";

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
    const body = (await request.json()) as { amount?: unknown; reason?: unknown };
    const amount = Number(body.amount);
    const reason = String(body.reason ?? "").trim();

    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: "Enter a non-zero credit amount." }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: "A reason is required." }, { status: 400 });
    }

    const result = await adjustUserCredits({
      adminUserId: admin.id,
      targetUserId: id,
      amount,
      reason
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
