import {
  clearGoogleDriveAccessToken,
  resolveGoogleDriveAccessToken
} from "@/lib/google-drive-token";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { absoluteUrl } from "@/lib/site";

type DriveUploadResult = {
  id: string;
  name: string;
  webViewLink?: string;
};

export const googleDriveReturnPathKey = "trb.google.driveReturnPath";

function isSafeDriveReturnPath(value: string | null) {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      (value.startsWith("/business-data-generator") || value.startsWith("/profile"))
  );
}

export function rememberGoogleDriveReturnPath(returnPath: string) {
  if (typeof window === "undefined" || !isSafeDriveReturnPath(returnPath)) {
    return;
  }

  window.sessionStorage.setItem(googleDriveReturnPathKey, returnPath);
  window.localStorage.setItem(googleDriveReturnPathKey, returnPath);
}

export function getStoredGoogleDriveReturnPath() {
  if (typeof window === "undefined") {
    return null;
  }

  const returnPath =
    window.sessionStorage.getItem(googleDriveReturnPathKey) ??
    window.localStorage.getItem(googleDriveReturnPathKey);

  return isSafeDriveReturnPath(returnPath) ? returnPath : null;
}

export function clearStoredGoogleDriveReturnPath() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(googleDriveReturnPathKey);
  window.localStorage.removeItem(googleDriveReturnPathKey);
}

export function readOAuthCallbackError() {
  if (typeof window === "undefined") {
    return null;
  }

  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode = hash.get("error_code") || search.get("error_code");
  const errorDescription = hash.get("error_description") || search.get("error_description");

  if (!errorCode && !errorDescription && !hash.get("error") && !search.get("error")) {
    return null;
  }

  return {
    code: errorCode,
    description: errorDescription?.replace(/\+/g, " ")
  };
}

export function getDriveOAuthErrorMessage(error: { code: string | null; description: string | null }) {
  if (error.code === "identity_already_exists") {
    return "This Google account is already linked to another Tech Revenue Brief profile. Sign in with Google instead, or choose a different Google account for Drive export.";
  }

  if (/manual linking is disabled/i.test(error.description ?? "")) {
    return "Google Drive linking is disabled in Supabase. Enable Allow manual linking in Supabase Auth settings, then try again.";
  }

  return (
    error.description ||
    "Google Drive authorization failed. Check Supabase Auth URL settings and try again."
  );
}

export function appendQueryParams(path: string, params: Record<string, string>) {
  const url = new URL(path, "https://techrevenuebrief.com");

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return `${url.pathname}${url.search}`;
}

export async function uploadCsvWorkbookToGoogleDrive(input: {
  csv: string;
  filename: string;
  workbookBlob: Blob;
}) {
  const providerToken = await resolveGoogleDriveAccessToken();
  if (!providerToken) {
    throw new Error("GOOGLE_DRIVE_AUTH_REQUIRED");
  }

  const boundary = `trb_drive_export_${Date.now()}`;
  const metadata = {
    name: input.filename,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
  const multipartBody = new Blob([
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "",
    await input.workbookBlob.arrayBuffer(),
    `--${boundary}--`,
    ""
  ].flatMap((part) => (typeof part === "string" ? [`${part}\r\n`] : [part, "\r\n"])));
  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    }
  );
  const uploadJson = (await uploadResponse.json()) as {
    id?: string;
    name?: string;
    webViewLink?: string;
    error?: { message?: string; status?: string };
  };

  if (!uploadResponse.ok || !uploadJson.id) {
    const googleMessage = uploadJson.error?.message ?? "";
    if (
      uploadResponse.status === 401 ||
      /insufficient authentication scopes|invalid credentials|unauthorized|invalid token/i.test(
        googleMessage
      )
    ) {
      clearGoogleDriveAccessToken();
      throw new Error("GOOGLE_DRIVE_AUTH_REQUIRED");
    }

    throw new Error(googleMessage || "Google Drive upload failed. Try signing in with Google again.");
  }

  return {
    id: uploadJson.id,
    name: uploadJson.name ?? input.filename,
    webViewLink: uploadJson.webViewLink
  } satisfies DriveUploadResult;
}

async function redirectToGoogleDriveOAuth(
  returnPath: string,
  session: { user: { id: string } } | null
) {
  const supabase = getSupabaseBrowserClient();
  rememberGoogleDriveReturnPath(returnPath);

  const oauthOptions = {
    redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(returnPath)}`),
    scopes: "https://www.googleapis.com/auth/drive.file",
    queryParams: {
      access_type: "offline",
      prompt: "consent"
    },
    skipBrowserRedirect: false
  };

  if (session) {
    const linkResult = await supabase.auth.linkIdentity({
      provider: "google",
      options: oauthOptions
    });

    if (linkResult.error) {
      return {
        data: { url: null },
        error: new Error(
          linkResult.error.message ||
            "Google Drive connection failed. Try again and allow Google access when prompted."
        )
      };
    }

    if (linkResult.data.url) {
      window.location.assign(linkResult.data.url);
    }

    return linkResult;
  }

  const result = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: oauthOptions
  });

  if (result.error) {
    return {
      data: { url: null },
      error: result.error
    };
  }

  if (result.data.url) {
    window.location.assign(result.data.url);
  }

  return result;
}

export async function requestGoogleDriveIdentityLink(returnPath: string) {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  return redirectToGoogleDriveOAuth(returnPath, session);
}
