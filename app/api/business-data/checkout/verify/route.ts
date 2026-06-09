import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import {
  creditTokens,
  getBusinessDataCreditBundle,
  logUsageEvent,
  TOKEN_COSTS
} from "@/lib/business-data-tokens";
import {
  businessDataPaidCookieName,
  businessDataPaidCookieOptions,
  createBusinessDataPaidCookie
} from "@/lib/business-data-paid-access";
import { sendBusinessDataPaymentEmail } from "@/lib/business-data-payment-email";

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

type StripeCheckoutSession = {
  id?: string;
  mode?: string;
  payment_status?: string;
  status?: string;
  metadata?: {
    product?: string;
    user_id?: string;
    bundle_id?: string;
    credits?: string;
    bundle_name?: string;
  };
  client_reference_id?: string;
  customer_details?: { email?: string };
  amount_total?: number;
  currency?: string;
  error?: {
    message?: string;
  };
};

function isPaidBusinessDataSession(session: StripeCheckoutSession) {
  const completed = session.status === "complete";
  const paid =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";

  return completed && paid && session.metadata?.product === "business-data-export";
}

function getSessionCredits(session: StripeCheckoutSession) {
  const metadataCredits = Number(session.metadata?.credits);

  if (Number.isFinite(metadataCredits) && metadataCredits > 0) {
    return Math.round(metadataCredits);
  }

  return getBusinessDataCreditBundle(session.metadata?.bundle_id).credits;
}

export async function GET(request: Request) {
  try {
    const secretKey = getStripeSecretKey();

    if (!secretKey) {
      return NextResponse.json({ paid: false, error: "Stripe is not configured." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id")?.trim();

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ paid: false, error: "Missing checkout session." }, { status: 400 });
    }

    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`
        },
        signal: AbortSignal.timeout(15000)
      }
    );
    const session = (await response.json()) as StripeCheckoutSession;

    if (!response.ok || !isPaidBusinessDataSession(session)) {
      return NextResponse.json(
        { paid: false, error: session.error?.message ?? "Checkout was not paid." },
        { status: 402 }
      );
    }

    const userId = session.client_reference_id || session.metadata?.user_id;
    const creditsGranted = getSessionCredits(session);

    if (userId) {
      const creditResult = await creditTokens({
        userId,
        amount: creditsGranted,
        reason: "stripe_checkout_verify_fallback",
        stripeSessionId: session.id ?? sessionId,
        metadata: {
          source: "checkout_verify",
          bundle_id: session.metadata?.bundle_id ?? null
        }
      });

      if (!creditResult.alreadyProcessed) {
        try {
          await sendBusinessDataPaymentEmail({
            to: session.customer_details?.email,
            bundleName: session.metadata?.bundle_name,
            credits: creditsGranted,
            amountTotal: session.amount_total,
            currency: session.currency
          });
        } catch (emailError) {
          console.error("[stripe-checkout-verify-email]", emailError);
        }

        await logUsageEvent({
          userId,
          eventType: "tokens_credited",
          metadata: {
            amount: creditsGranted,
            stripe_session_id: session.id ?? sessionId,
            bundle_id: session.metadata?.bundle_id ?? null,
            source: "checkout_verify"
          }
        });
      }
    }

    const result = NextResponse.json({
      paid: true,
      tokensGranted: creditsGranted,
      creditsGranted,
      exportTokenCost: TOKEN_COSTS.fullExport,
      exportCreditCost: TOKEN_COSTS.fullExport,
      driveTokenCost: TOKEN_COSTS.driveUpload
    });
    result.cookies.set(
      businessDataPaidCookieName,
      createBusinessDataPaidCookie(session.id ?? sessionId),
      businessDataPaidCookieOptions()
    );

    return result;
  } catch (error) {
    return NextResponse.json(
      { paid: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as { sessionId?: string };
    const sessionId = String(body.sessionId ?? "").trim();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    const verifyUrl = new URL(request.url);
    verifyUrl.searchParams.set("session_id", sessionId);

    const verifyRequest = new Request(verifyUrl.toString(), {
      headers: request.headers
    });

    return GET(verifyRequest);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
