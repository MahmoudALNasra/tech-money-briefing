const TURNSTILE_PLACEHOLDER_PATTERN =
  /^(your[-_]?turnstile[-_]?(site[-_]?)?key|your[-_]?turnstile[-_]?secret[-_]?key|\.\.\.|xxx+|changeme|null|undefined|test|placeholder)$/i;

const CLOUDFLARE_DUMMY_SITE_KEY_PATTERN = /^[123]x0+[a-f0-9]{2}$/i;

function isConfiguredTurnstileValue(value?: string | null) {
  const normalized = value?.trim();

  if (!normalized || normalized.length < 10 || /^\.+$/.test(normalized)) {
    return false;
  }

  return !TURNSTILE_PLACEHOLDER_PATTERN.test(normalized);
}

export function isCloudflareTurnstileDummySiteKey(value?: string | null) {
  const normalized = (value ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)?.trim();
  return Boolean(normalized && CLOUDFLARE_DUMMY_SITE_KEY_PATTERN.test(normalized));
}

export function isLocalDevHostname(hostname?: string | null) {
  const host = hostname?.trim().toLowerCase() ?? "";

  if (!host) {
    return false;
  }

  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
}

export function isTurnstileAllowedOnLocalhost() {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_ALLOW_LOCALHOST === "true" ||
    isCloudflareTurnstileDummySiteKey()
  );
}

export function isTurnstileSiteKeyConfigured(value?: string | null) {
  return isConfiguredTurnstileValue(value ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export function isTurnstileSecretConfigured(value?: string | null) {
  return isConfiguredTurnstileValue(value ?? process.env.TURNSTILE_SECRET_KEY);
}

export function shouldRenderTurnstileWidget(hostname?: string | null) {
  if (!isTurnstileSiteKeyConfigured()) {
    return false;
  }

  if (isLocalDevHostname(hostname) && !isTurnstileAllowedOnLocalhost()) {
    return false;
  }

  return true;
}

export function shouldRequireTurnstileVerification(hostname?: string | null) {
  if (!isTurnstileSiteKeyConfigured() || !isTurnstileSecretConfigured()) {
    return false;
  }

  if (isLocalDevHostname(hostname) && !isTurnstileAllowedOnLocalhost()) {
    return false;
  }

  return true;
}

export function getTurnstileLocalhostDevMessage() {
  return "Local dev: your production Turnstile key is not authorized for localhost. Search works here without captcha. For local widget testing, add localhost in Cloudflare Hostname Management and set NEXT_PUBLIC_TURNSTILE_ALLOW_LOCALHOST=true, or use Cloudflare dummy keys in .env.local.";
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip?: string | null,
  hostname?: string | null
) {
  if (!shouldRequireTurnstileVerification(hostname)) {
    return { ok: true, skipped: true as const };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!token) {
    return {
      ok: false,
      skipped: false as const,
      error:
        "Security check is required. Complete the Turnstile verification, then try again."
    };
  }

  const body = new URLSearchParams({
    secret: secret as string,
    response: token
  });

  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(8000)
  });

  const json = (await response.json()) as { success?: boolean; "error-codes"?: string[] };

  if (!response.ok || !json.success) {
    const errorCodes = json["error-codes"] ?? [];
    const friendlyMessage = errorCodes.includes("timeout-or-duplicate")
      ? "Security check expired or was already used. Complete the Turnstile check again, then retry."
      : errorCodes.join(", ") || "Turnstile verification failed.";

    return {
      ok: false,
      skipped: false as const,
      error: friendlyMessage
    };
  }

  return { ok: true, skipped: false as const };
}
