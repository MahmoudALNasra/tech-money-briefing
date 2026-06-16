"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { OAuthProviderIcon } from "@/components/auth/OAuthProviderIcon";
import {
  AUTH_OAUTH_PROVIDERS,
  formatOAuthSignInMessage,
  readAuthProviderUsage,
  recordAuthProviderUsage,
  type AuthProviderUsage,
  type OAuthProviderId
} from "@/lib/auth-oauth-providers";
import { absoluteUrl } from "@/lib/site";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [lastProviderUsage, setLastProviderUsage] = useState<AuthProviderUsage | null>(null);
  const isSignup = mode === "signup";
  const authSwitchPath = `${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(
    nextPath
  )}`;

  useEffect(() => {
    setLastProviderUsage(readAuthProviderUsage());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function redirectSignedInUser() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (!mounted || !data.session) {
          return;
        }

        router.replace(nextPath);
        router.refresh();
      } catch {
        // Keep the auth form visible if Supabase is not configured.
      }
    }

    redirectSignedInUser();

    return () => {
      mounted = false;
    };
  }, [nextPath, router]);

  const checkVerificationStatus = async (targetEmail: string) => {
    const response = await fetch("/api/auth/verification-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: targetEmail })
    });
    const json = (await response.json()) as {
      exists?: boolean;
      verified?: boolean;
      provider?: string | null;
      providerLabel?: string | null;
      usesOAuth?: boolean;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(json.error ?? "Unable to check email verification.");
    }

    return json;
  };

  const showOAuthProviderMessage = (provider?: string | null) => {
    setVerificationEmail("");
    setMessage(formatOAuthSignInMessage(provider));
  };

  const showUnverifiedMessage = (targetEmail: string) => {
    setVerificationEmail(targetEmail);
    setMessage(
      "This email is registered but not verified yet. A verification email was sent. Want us to resend it?"
    );
  };

  const resendVerificationEmail = async () => {
    const targetEmail = verificationEmail || email.trim().toLowerCase();

    if (!targetEmail) {
      setMessage("Enter your email first, then request another verification email.");
      return;
    }

    setIsResendingVerification(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: targetEmail, next: nextPath })
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Unable to resend verification email.");
      }

      setVerificationEmail(targetEmail);
      setMessage("Verification email resent. Check your inbox and spam folder.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsResendingVerification(false);
    }
  };

  const submitWithEmail = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setIsLoading(true);
    setMessage("");
    setVerificationEmail("");

    try {
      const supabase = getSupabaseBrowserClient();
      const normalizedEmail = email.trim().toLowerCase();

      if (isSignup) {
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            next: nextPath
          })
        });
        const signupJson = (await signupResponse.json()) as { error?: string };

        if (!signupResponse.ok) {
          const status = await checkVerificationStatus(normalizedEmail).catch(() => null);

          if (status?.exists && !status.verified) {
            showUnverifiedMessage(normalizedEmail);
            return;
          }

          if (status?.verified) {
            setMessage("An account already exists for this email. Sign in instead.");
            return;
          }

          throw new Error(signupJson.error ?? "Unable to create your account.");
        }

        setVerificationEmail(normalizedEmail);
        setMessage("We sent a Tech Revenue Brief verification email. Check your inbox and spam folder.");
        return;
      }

      const authResponse = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (authResponse.error) {
        if (/email not confirmed/i.test(authResponse.error.message)) {
          showUnverifiedMessage(normalizedEmail);
          return;
        }

        const status = await checkVerificationStatus(normalizedEmail).catch(() => null);
        if (status?.exists && status.usesOAuth) {
          showOAuthProviderMessage(status.provider);
          return;
        }

        throw authResponse.error;
      }

      recordAuthProviderUsage({
        provider: "email",
        email: authResponse.data.user?.email ?? normalizedEmail,
        usedAt: authResponse.data.user?.last_sign_in_at ?? new Date().toISOString()
      });

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (providerId: OAuthProviderId) => {
    setIsLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const provider = AUTH_OAUTH_PROVIDERS.find((item) => item.id === providerId);

      if (!provider) {
        throw new Error("This sign-in provider is not available.");
      }

      const redirectTo = absoluteUrl(`/auth/callback?next=${encodeURIComponent(nextPath)}`);
      const providerOptions =
        providerId === "google"
          ? {
              redirectTo,
              scopes: "email profile https://www.googleapis.com/auth/drive.file",
              queryParams: {
                access_type: "offline",
                prompt: "consent"
              }
            }
          : providerId === "azure"
            ? {
                redirectTo,
                scopes: "openid email profile User.Read"
              }
            : { redirectTo };
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.supabaseProvider,
        options: providerOptions
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-w-0 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-8" data-surface="light">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
        {isSignup ? "Create account" : "Welcome back"}
      </p>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
        {isSignup ? "Create your workspace profile" : "Sign in to your profile"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Save business data searches, unlock exports, and manage your paid tools
        account as this product grows.
      </p>
      <form className="mt-6 space-y-4" onSubmit={submitWithEmail}>
        <div className="grid gap-3 sm:grid-cols-2">
          {AUTH_OAUTH_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => void signInWithProvider(provider.id)}
              disabled={isLoading}
              className="flex min-h-12 min-w-0 flex-wrap items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-sm font-black text-ink transition hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
            >
              <OAuthProviderIcon provider={provider.id} />
              <span>{provider.label}</span>
              {lastProviderUsage?.provider === provider.id ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Last used
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          or email
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <label className="block text-sm font-semibold text-stone-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950 caret-stone-950 outline-none ring-stone-200 transition placeholder:text-stone-400 focus:border-emerald-300 focus:ring-4 sm:text-sm"
            autoComplete="email"
          />
        </label>

        <label className="block text-sm font-semibold text-stone-700">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950 caret-stone-950 outline-none ring-stone-200 transition placeholder:text-stone-400 focus:border-emerald-300 focus:ring-4 sm:text-sm"
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </label>

        <button
          type="submit"
          disabled={isLoading || !email || password.length < 6}
          className="min-h-12 w-full rounded-full bg-ink px-6 text-sm font-black text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isLoading
            ? "Working..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {message ? (
        <div className="mt-4 rounded-2xl bg-stone-100 p-3 text-sm font-semibold text-stone-700">
          <p>{message}</p>
          {verificationEmail ? (
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              disabled={isResendingVerification}
              className="mt-3 rounded-full bg-ink px-4 py-2 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-400"
            >
              {isResendingVerification ? "Resending..." : "Resend verification email"}
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 text-center text-sm text-stone-600">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={authSwitchPath}
          className="font-black text-ink underline"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
