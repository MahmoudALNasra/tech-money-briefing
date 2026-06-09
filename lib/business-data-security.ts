import { isLikelyBotUserAgent } from "@/lib/bot-detection";
import { checkRateLimit } from "@/lib/business-data-rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

function requestHostname(request: Request) {
  return request.headers.get("host")?.split(":")[0]?.trim().toLowerCase() || null;
}

export async function enforceBusinessDataSecurity(input: {
  request: Request;
  action: "places" | "search" | "export" | "checkout";
  turnstileToken?: string | null;
}) {
  const userAgent = input.request.headers.get("user-agent");

  if (isLikelyBotUserAgent(userAgent)) {
    return { ok: false as const, status: 403, error: "Automated traffic is blocked." };
  }

  const limits = {
    places: { limit: 60, windowMs: 60_000 },
    search: { limit: 20, windowMs: 60_000 },
    export: { limit: 8, windowMs: 60_000 },
    checkout: { limit: 10, windowMs: 60_000 }
  } as const;

  const rate = checkRateLimit({
    request: input.request,
    prefix: `business-data:${input.action}`,
    ...limits[input.action]
  });

  if (!rate.allowed) {
    return {
      ok: false as const,
      status: 429,
      error: "Too many requests. Please wait a moment and try again."
    };
  }

  if (input.action === "search" || input.action === "export") {
    const turnstile = await verifyTurnstileToken(
      input.turnstileToken,
      clientIp(input.request),
      requestHostname(input.request)
    );

    if (!turnstile.ok) {
      return {
        ok: false as const,
        status: 403,
        error: turnstile.error ?? "Security verification failed."
      };
    }
  }

  return { ok: true as const };
}
