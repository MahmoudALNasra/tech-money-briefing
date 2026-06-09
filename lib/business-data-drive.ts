import {
  clearGoogleDriveAccessToken,
  prefersGoogleDriveRedirectAuth,
  requestGoogleDriveAccessTokenForCurrentUser,
  resolveGoogleDriveAccessToken
} from "@/lib/google-drive-token";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { absoluteUrl } from "@/lib/site";

type DriveUploadResult = {
  id: string;
  name: string;
  webViewLink?: string;
};

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

function shouldFallbackGoogleDriveAuthToRedirect(error: unknown) {
  if (!(error instanceof Error)) {
    return prefersGoogleDriveRedirectAuth();
  }

  if (error.message === "GOOGLE_DRIVE_CLIENT_ID_REQUIRED") {
    return true;
  }

  return prefersGoogleDriveRedirectAuth();
}

async function redirectToGoogleDriveOAuth(
  returnPath: string,
  session: { user: { id: string } } | null
) {
  const supabase = getSupabaseBrowserClient();
  const oauthOptions = {
    redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(returnPath)}`),
    scopes: "email profile https://www.googleapis.com/auth/drive.file",
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

  if (session && !prefersGoogleDriveRedirectAuth()) {
    try {
      await requestGoogleDriveAccessTokenForCurrentUser(session.user.id);
      return { data: { url: null }, error: null };
    } catch (error) {
      if (!shouldFallbackGoogleDriveAuthToRedirect(error)) {
        return {
          data: { url: null },
          error: error instanceof Error ? error : new Error(String(error))
        };
      }
    }
  }

  return redirectToGoogleDriveOAuth(returnPath, session);
}
