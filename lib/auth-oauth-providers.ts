import type { Provider } from "@supabase/supabase-js";

export type OAuthProviderId = "google" | "azure" | "linkedin_oidc" | "github";
export type AuthProviderId = OAuthProviderId | "email";

export type OAuthProviderConfig = {
  id: OAuthProviderId;
  supabaseProvider: Provider;
  label: string;
  profileLabel: string;
};

export const AUTH_OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: "google",
    supabaseProvider: "google",
    label: "Google",
    profileLabel: "Google"
  },
  {
    id: "azure",
    supabaseProvider: "azure",
    label: "Microsoft",
    profileLabel: "Microsoft"
  },
  {
    id: "linkedin_oidc",
    supabaseProvider: "linkedin_oidc",
    label: "LinkedIn",
    profileLabel: "LinkedIn"
  },
  {
    id: "github",
    supabaseProvider: "github",
    label: "GitHub",
    profileLabel: "GitHub"
  }
];

const providerProfileLabels = Object.fromEntries(
  AUTH_OAUTH_PROVIDERS.map((provider) => [provider.supabaseProvider, provider.profileLabel])
) as Record<string, string>;

const authProviderUsageStorageKey = "trb-auth-last-provider";

export type AuthProviderUsage = {
  provider: AuthProviderId;
  label: string;
  email?: string;
  usedAt: string;
};

export function formatOAuthSignInMessage(provider?: string | null) {
  const label = formatAuthProviderLabel(provider);
  return `This email was created with ${label}. Continue with ${label} instead of email and password.`;
}

export function formatAuthProviderLabel(provider?: string | null) {
  if (!provider) {
    return "Email";
  }

  if (provider === "email") {
    return "Email";
  }

  return providerProfileLabels[provider] ?? provider;
}

export function getOAuthProviderBySupabaseProvider(provider?: string | null) {
  return AUTH_OAUTH_PROVIDERS.find((item) => item.supabaseProvider === provider);
}

export function recordAuthProviderUsage(input: {
  provider: AuthProviderId;
  email?: string;
  usedAt?: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const providerLabel =
    input.provider === "email"
      ? "Email"
      : (AUTH_OAUTH_PROVIDERS.find((provider) => provider.id === input.provider)?.label ??
        formatAuthProviderLabel(input.provider));

  window.localStorage.setItem(
    authProviderUsageStorageKey,
    JSON.stringify({
      provider: input.provider,
      label: providerLabel,
      email: input.email,
      usedAt: input.usedAt ?? new Date().toISOString()
    } satisfies AuthProviderUsage)
  );
}

export function readAuthProviderUsage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(authProviderUsageStorageKey);
    if (!raw) {
      return null;
    }

    const usage = JSON.parse(raw) as Partial<AuthProviderUsage>;
    if (
      !usage.provider ||
      !usage.label ||
      typeof usage.usedAt !== "string"
    ) {
      return null;
    }

    return usage as AuthProviderUsage;
  } catch {
    return null;
  }
}
