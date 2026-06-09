const driveAccessTokenKey = "trb.google.driveAccessToken";
const driveRefreshTokenKey = "trb.google.driveRefreshToken";
const driveTokenUserIdKey = "trb.google.driveTokenUserId";
const googleDriveClientId =
  process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim() ||
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim() ||
  "";

type GoogleDriveTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleOAuthTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleDriveTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => GoogleOAuthTokenClient;
        };
      };
    };
  }
}

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

function loadGoogleIdentityServices() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Drive export can only run in the browser."));
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load Google Drive authorization.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Drive authorization."));
    document.head.appendChild(script);
  });
}

export async function requestGoogleDriveAccessTokenForCurrentUser(userId: string) {
  if (!googleDriveClientId) {
    throw new Error("GOOGLE_DRIVE_CLIENT_ID_REQUIRED");
  }

  await loadGoogleIdentityServices();

  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new Error("Google Drive authorization is unavailable in this browser.");
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: googleDriveClientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google Drive permission was not granted."
            )
          );
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google Drive permission did not return an access token."));
          return;
        }

        resolve(response.access_token);
      },
      error_callback: (error) => reject(error)
    });

    tokenClient.requestAccessToken({ prompt: "consent select_account" });
  });

  storeGoogleDriveAccessToken(accessToken, null, userId);
  return accessToken;
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
