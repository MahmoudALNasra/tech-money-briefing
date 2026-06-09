import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import { getOrCreateWallet, getRecentLedger } from "@/lib/business-data-tokens";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const wallet = await getOrCreateWallet(user.id);
    const ledger = await getRecentLedger(user.id, 8);

    return NextResponse.json({
      balance: wallet.balance,
      lifetimeCredited: wallet.lifetime_credited,
      lifetimeDebited: wallet.lifetime_debited,
      ledger
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
