import { NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/business-data-auth";
import { enforceBusinessDataSecurity } from "@/lib/business-data-security";
import { getBusinessDataCreditBundle, logUsageEvent } from "@/lib/business-data-tokens";
import { absoluteUrl, siteConfig } from "@/lib/site";

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function getStripeConfig(bundleId?: unknown) {
  const checkoutMode = process.env.STRIPE_BUSINESS_DATA_CHECKOUT_MODE?.trim();
  const bundle = getBusinessDataCreditBundle(bundleId);
  const bundlePriceId = process.env[bundle.stripePriceEnv]?.trim();
  const legacyPriceId = process.env.STRIPE_BUSINESS_DATA_EXPORT_PRICE_ID?.trim() ?? "";

  return {
    secretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
    priceId: bundlePriceId || legacyPriceId,
    bundle,
    mode: checkoutMode === "subscription" ? "subscription" : "payment"
  };
}

export async function POST(request: Request) {
  try {
    const security = await enforceBusinessDataSecurity({ request, action: "checkout" });

    if (!security.ok) {
      return NextResponse.json({ error: security.error }, { status: security.status });
    }

    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Sign in before starting checkout so credits can be added to your account." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { secretKey, priceId, bundle, mode } = getStripeConfig(body.bundleId);

    if (!secretKey || !priceId) {
      return NextResponse.json(
        {
          error:
            `Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY and ${bundle.stripePriceEnv}.`
        },
        { status: 503 }
      );
    }

    const location = cleanText(body.location, 140);
    const category = cleanText(body.category, 60);
    const radiusMeters = cleanText(body.radiusMeters, 16);
    const cacheKey = cleanText(body.cacheKey, 120);
    const siteUrl = siteConfig.url;
    const customerEmail = user.email?.trim();
    const invoiceDescription = `${bundle.name} business data credits for Tech Revenue Brief`;

    const params = new URLSearchParams({
      mode,
      locale: "auto",
      billing_address_collection: "auto",
      client_reference_id: user.id,
      success_url: absoluteUrl(
        `/business-data-generator?checkout=success&session_id={CHECKOUT_SESSION_ID}&cache=${encodeURIComponent(cacheKey)}`
      ),
      cancel_url: absoluteUrl("/business-data-generator?checkout=cancelled"),
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[product]": "business-data-export",
      "metadata[user_id]": user.id,
      "metadata[bundle_id]": bundle.id,
      "metadata[bundle_name]": bundle.name,
      "metadata[credits]": String(bundle.credits),
      "metadata[price_usd]": String(bundle.priceUsd),
      "metadata[location]": location,
      "metadata[category]": category,
      "metadata[radius_meters]": radiusMeters,
      "metadata[cache_key]": cacheKey,
      "metadata[site_url]": siteUrl,
      "custom_text[submit][message]": `Credits are added to your Tech Revenue Brief account after payment. Website: ${siteUrl}`
    });

    if (customerEmail) {
      params.set("customer_email", customerEmail);
      params.set("metadata[customer_email]", customerEmail);
    }

    if (mode === "payment") {
      params.set("submit_type", "pay");

      if (customerEmail) {
        params.set("payment_intent_data[receipt_email]", customerEmail);
        params.set("payment_intent_data[metadata][customer_email]", customerEmail);
      }

      params.set("customer_creation", "always");
      params.set("payment_intent_data[description]", invoiceDescription);
      params.set("payment_intent_data[metadata][product]", "business-data-export");
      params.set("payment_intent_data[metadata][user_id]", user.id);
      params.set("payment_intent_data[metadata][bundle_id]", bundle.id);
      params.set("payment_intent_data[metadata][site_url]", siteUrl);
      params.set("invoice_creation[enabled]", "true");
      params.set("invoice_creation[invoice_data][description]", invoiceDescription);
      params.set("invoice_creation[invoice_data][footer]", `Website: ${siteUrl}`);
      params.set("invoice_creation[invoice_data][custom_fields][0][name]", "Website");
      params.set("invoice_creation[invoice_data][custom_fields][0][value]", siteUrl);
      params.set("invoice_creation[invoice_data][metadata][product]", "business-data-export");
      params.set("invoice_creation[invoice_data][metadata][user_id]", user.id);
      params.set("invoice_creation[invoice_data][metadata][bundle_id]", bundle.id);
      params.set("invoice_creation[invoice_data][metadata][site_url]", siteUrl);
      if (customerEmail) {
        params.set("invoice_creation[invoice_data][metadata][customer_email]", customerEmail);
      }
    } else {
      params.set("subscription_data[description]", invoiceDescription);
      params.set("subscription_data[metadata][product]", "business-data-export");
      params.set("subscription_data[metadata][user_id]", user.id);
      params.set("subscription_data[metadata][bundle_id]", bundle.id);
      params.set("subscription_data[metadata][site_url]", siteUrl);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15000)
    });

    const json = (await response.json()) as { url?: string; error?: { message?: string } };

    if (!response.ok || !json.url) {
      return NextResponse.json(
        { error: json.error?.message ?? "Could not create Stripe checkout session." },
        { status: 500 }
      );
    }

    await logUsageEvent({
      userId: user.id,
      eventType: "checkout_started",
      metadata: {
        category,
        location,
        radius_meters: radiusMeters,
        bundle_id: bundle.id,
        credits: bundle.credits,
        price_usd: bundle.priceUsd
      }
    });

    return NextResponse.json({ url: json.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
