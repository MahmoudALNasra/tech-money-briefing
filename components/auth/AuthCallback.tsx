"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getOAuthProviderBySupabaseProvider,
  recordAuthProviderUsage
} from "@/lib/auth-oauth-providers";
import { storeGoogleDriveAccessToken } from "@/lib/google-drive-token";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign in...");

  useEffect(() => {
    async function finishAuth() {
      const nextPath = searchParams.get("next") || "/";
      const code = searchParams.get("code");
      const authError =
        searchParams.get("error_description") ||
        searchParams.get("error") ||
        searchParams.get("error_code");
      const isDriveReturn =
        nextPath.includes("drive=connected") &&
        (nextPath.startsWith("/business-data-generator") || nextPath.startsWith("/profile"));

      try {
        if (authError) {
          throw new Error(authError);
        }

        const supabase = getSupabaseBrowserClient();
        const { data, error } = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!data.session) {
          throw new Error("Sign-in did not return a session. Check this provider's callback URL and Supabase provider settings.");
        }

        const provider = getOAuthProviderBySupabaseProvider(
          String(data.session.user.app_metadata.provider ?? "")
        );
        recordAuthProviderUsage({
          provider: provider?.id ?? "email",
          email: data.session.user.email,
          usedAt: data.session.user.last_sign_in_at ?? new Date().toISOString()
        });

        if (isDriveReturn && data.session.provider_token) {
          storeGoogleDriveAccessToken(
            data.session.provider_token,
            data.session.provider_refresh_token,
            data.session.user.id
          );
        }

        router.replace(nextPath);
        if (!isDriveReturn) {
          router.refresh();
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    }

    finishAuth();
  }, [router, searchParams]);

  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-emerald-400" />
      <p className="mt-4 text-sm font-bold text-stone-700">{message}</p>
    </div>
  );
}
