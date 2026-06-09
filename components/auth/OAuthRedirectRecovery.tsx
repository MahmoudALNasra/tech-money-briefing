"use client";

import { useEffect } from "react";

import {
  appendQueryParams,
  getDriveOAuthErrorMessage,
  getStoredGoogleDriveReturnPath,
  readOAuthCallbackError
} from "@/lib/business-data-drive";

function hasOAuthCallbackState(search: string, hash: string) {
  if (hasOAuthHash(hash)) {
    return true;
  }

  return /(?:^|[?&])(error|error_code|code|access_token)=/.test(search);
}

function hasOAuthHash(hash: string) {
  if (!hash) {
    return false;
  }

  const params = new URLSearchParams(hash.replace(/^#/, ""));

  return (
    params.has("access_token") ||
    params.has("refresh_token") ||
    params.has("provider_token") ||
    params.has("error") ||
    params.has("error_description") ||
    params.has("error_code")
  );
}

export function OAuthRedirectRecovery() {
  useEffect(() => {
    const returnPath = getStoredGoogleDriveReturnPath();

    if (!returnPath || window.location.pathname === "/auth/callback") {
      return;
    }

    const search = window.location.search;
    const hash = window.location.hash;
    const oauthError = readOAuthCallbackError();
    const shouldRecover =
      hasOAuthCallbackState(search, hash) || window.location.pathname === "/";

    if (!shouldRecover) {
      return;
    }

    if (oauthError) {
      const destination = appendQueryParams(returnPath, {
        driveError: oauthError.code ?? "oauth_error",
        driveMessage: getDriveOAuthErrorMessage(oauthError)
      });
      window.location.replace(destination);
      return;
    }

    window.location.replace(
      `/auth/callback?next=${encodeURIComponent(returnPath)}${search}${hash}`
    );
  }, []);

  return null;
}
