import { createHmac, timingSafeEqual } from "crypto";

export const businessDataPaidCookieName = "trb_business_data_paid";

const paidAccessMaxAgeSeconds = 60 * 60 * 24 * 30;

type PaidAccessPayload = {
  product: "business-data-export";
  sessionId: string;
  expiresAt: number;
};

function getSigningSecret() {
  return (
    process.env.BUSINESS_DATA_PAID_ACCESS_SECRET ??
    process.env.TRACKING_HASH_SECRET ??
    process.env.STRIPE_SECRET_KEY ??
    ""
  ).trim();
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createBusinessDataPaidCookie(sessionId: string) {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error(
      "Missing BUSINESS_DATA_PAID_ACCESS_SECRET, TRACKING_HASH_SECRET, or STRIPE_SECRET_KEY."
    );
  }

  const payload: PaidAccessPayload = {
    product: "business-data-export",
    sessionId,
    expiresAt: Date.now() + paidAccessMaxAgeSeconds * 1000
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyBusinessDataPaidCookie(cookieValue: string | undefined) {
  const secret = getSigningSecret();

  if (!cookieValue || !secret) {
    return false;
  }

  const [encodedPayload, signature] = cookieValue.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<PaidAccessPayload>;

    return (
      payload.product === "business-data-export" &&
      typeof payload.sessionId === "string" &&
      typeof payload.expiresAt === "number" &&
      payload.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export function businessDataPaidCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: paidAccessMaxAgeSeconds
  };
}
