import { getUserFromRequest, type AuthenticatedUser } from "@/lib/business-data-auth";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1]?.trim() ?? "";
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as {
      aal?: string;
      amr?: Array<{ method?: string } | string>;
    };
  } catch {
    return null;
  }
}

function hasMfaAssurance(request: Request) {
  const claims = decodeJwtPayload(getBearerToken(request));

  if (claims?.aal === "aal2") {
    return true;
  }

  return claims?.amr?.some((method) =>
    typeof method === "string"
      ? method === "totp" || method === "mfa"
      : method.method === "totp" || method.method === "mfa"
  ) ?? false;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function getAdminFromRequest(
  request: Request
): Promise<AuthenticatedUser | null> {
  const user = await getUserFromRequest(request);

  if (!user || !isAdminEmail(user.email)) {
    return null;
  }

  if (!hasMfaAssurance(request)) {
    return null;
  }

  return user;
}

export function requireAdminConfigured() {
  if (getAdminEmails().length === 0) {
    throw new Error("ADMIN_EMAILS is not configured.");
  }
}
