import { NextResponse } from "next/server";

import {
  creditTokens,
  getBusinessDataCreditBundle,
  logUsageEvent
} from "@/lib/business-data-tokens";
import { sendBusinessDataPaymentEmail } from "@/lib/business-data-payment-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

async function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

  const timestamp = parts.t;
  const signatures = signature
    .split(",")
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const crypto = await import("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      metadata?: Record<string, string>;
      client_reference_id?: string;
      mode?: string;
      payment_status?: string;
      status?: string;
      customer_details?: { email?: string };
      amount_total?: number;
      currency?: string;
    };
  };
};

async function sendPaymentEmailSafely(input: {
  to?: string | null;
  bundleName?: string | null;
  credits: number;
  amountTotal?: number | null;
  currency?: string | null;
}) {
  try {
    await sendBusinessDataPaymentEmail(input);
  } catch (error) {
    console.error("[stripe-webhook-email]", error);
  }
}

async function fulfillCheckoutSession(session: StripeEvent["data"]["object"], eventId: string) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  const product = session.metadata?.product;

  if (!userId || product !== "business-data-export") {
    return;
  }

  const paid =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";
  const completed = session.status === "complete";

  if (!paid || !completed) {
    return;
  }

  const metadataCredits = Number(session.metadata?.credits);
  const creditsGranted =
    Number.isFinite(metadataCredits) && metadataCredits > 0
      ? Math.round(metadataCredits)
      : getBusinessDataCreditBundle(session.metadata?.bundle_id).credits;

  const result = await creditTokens({
    userId,
    amount: creditsGranted,
    reason: "stripe_checkout_completed",
    stripeSessionId: session.id,
    stripeEventId: eventId,
    metadata: {
      mode: session.mode ?? null,
      bundle_id: session.metadata?.bundle_id ?? null,
      credits: creditsGranted,
      email: session.customer_details?.email ?? null
    }
  });

  if (!result.alreadyProcessed) {
    await sendPaymentEmailSafely({
      to: session.customer_details?.email,
      bundleName: session.metadata?.bundle_name,
      credits: creditsGranted,
      amountTotal: session.amount_total,
      currency: session.currency
    });

    await logUsageEvent({
      userId,
      eventType: "tokens_credited",
      tokensCharged: 0,
      metadata: {
        amount: creditsGranted,
        stripe_session_id: session.id,
        bundle_id: session.metadata?.bundle_id ?? null,
        source: "stripe_webhook"
      }
    });
  }
}

export async function POST(request: Request) {
  const secretKey = getStripeSecretKey();
  const webhookSecret = getWebhookSecret();

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();

  const valid = await verifyStripeSignature(payload, signature, webhookSecret);

  if (!valid) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await fulfillCheckoutSession(event.data.object, event.id);
    }
  } catch (error) {
    console.error("[stripe-webhook]", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
