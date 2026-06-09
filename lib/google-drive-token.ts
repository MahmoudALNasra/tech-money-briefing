const driveAccessTokenKey = "trb.google.driveAccessToken";
const driveRefreshTokenKey = "trb.google.driveRefreshToken";
const driveTokenUserIdKey = "trb.google.driveTokenUserId";

export function storeGoogleDriveAccessToken(
  accessToken: string,
  refreshToken?: string | null,
  userId?: string
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(driveAccessTokenKey, accessToken);
  if (userId) {
    window.sessionStorage.setItem(driveTokenUserIdKey, userId);
  }
  if (refreshToken) {
    window.sessionStorage.setItem(driveRefreshTokenKey, refreshToken);
  }
}

export function readGoogleDriveAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(driveAccessTokenKey);
}

export function clearGoogleDriveAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(driveAccessTokenKey);
  window.sessionStorage.removeItem(driveRefreshTokenKey);
  window.sessionStorage.removeItem(driveTokenUserIdKey);
}

export async function resolveGoogleDriveAccessToken(): Promise<string | null> {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const userId = data.session?.user.id;
  const stored = readGoogleDriveAccessToken();

  if (stored && userId && window.sessionStorage.getItem(driveTokenUserIdKey) === userId) {
    return stored;
  }

  const provider = String(data.session?.user.app_metadata.provider ?? "");

  return provider === "google" ? data.session?.provider_token ?? null : null;
}
