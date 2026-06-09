"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingMascot } from "@/components/business-data/LoadingMascot";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";
import {
  BUSINESS_DATA_CREDIT_BUNDLES,
  type BusinessDataCreditBundleId
} from "@/lib/business-data-token-config";
import { ProfileReports } from "@/components/auth/ProfileReports";
import { formatAuthProviderLabel } from "@/lib/auth-oauth-providers";
import { formatCreditBalance } from "@/lib/format-token-balance";

type ProfileUser = {
  id: string;
  email?: string;
  provider?: string;
  lastSignInAt?: string;
  displayName: string;
};

type WalletResponse = {
  balance: number;
  lifetimeCredited: number;
  lifetimeDebited: number;
  ledger: Array<{
    delta: number;
    balance_after: number;
    reason: string;
    created_at: string;
  }>;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  return getBusinessDataAuthHeaders();
}

const creditBundleOptions = [
  BUSINESS_DATA_CREDIT_BUNDLES.starter,
  BUSINESS_DATA_CREDIT_BUNDLES.growth,
  BUSINESS_DATA_CREDIT_BUNDLES.agency
];

export function ProfilePanel() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [buyingBundleId, setBuyingBundleId] =
    useState<BusinessDataCreditBundleId | null>(null);

  const refreshWallet = async () => {
    const headers = await getAuthHeaders();
    const walletResponse = await fetch("/api/business-data/wallet", { headers });

    if (walletResponse.ok) {
      setWallet((await walletResponse.json()) as WalletResponse);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          router.replace("/login?next=/profile");
          return;
        }

        const profileUser = {
          id: data.user.id,
          email: data.user.email,
          provider: data.user.app_metadata.provider,
          lastSignInAt: data.user.last_sign_in_at,
          displayName:
            String(data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? "").trim() ||
            data.user.email?.split("@")[0] ||
            "Subscriber"
        };

        setUser(profileUser);
        setDisplayName(profileUser.displayName);
        await refreshWallet();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const saveDisplayName = async () => {
    setIsSavingProfile(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          name: displayName.trim()
        }
      });

      if (error) {
        throw error;
      }

      setUser((current) =>
        current ? { ...current, displayName: displayName.trim() } : current
      );
      setMessage("Display name updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const buyMoreCredits = async (bundleId: BusinessDataCreditBundleId) => {
    setBuyingBundleId(bundleId);
    setMessage("");

    try {
      const response = await fetch("/api/business-data/checkout", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          location: "",
          category: "",
          radiusMeters: 1000,
          cacheKey: window.crypto.randomUUID(),
          bundleId,
          product: "business-data-export"
        })
      });
      const json = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !json.url) {
        throw new Error(json.error ?? "Could not start checkout.");
      }

      window.location.href = json.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setBuyingBundleId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
        <LoadingMascot
          label="Loading profile..."
          description="The AI cat is checking your saved reports, credits, and account details."
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-stone-700">
          {message || "Redirecting to sign in..."}
        </p>
      </div>
    );
  }

  const isEmailProvider = user.provider === "email";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section
        id="credits"
        className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
          Profile
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
          Your business data workspace
        </h1>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="font-bold text-stone-500">Email</dt>
            <dd className="mt-1 font-black text-ink">{user.email ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="font-bold text-stone-500">Sign-in provider</dt>
            <dd className="mt-1 font-black text-ink">{formatAuthProviderLabel(user.provider)}</dd>
          </div>
          <div>
            <dt className="font-bold text-stone-500">Last sign-in</dt>
            <dd className="mt-1 font-black text-ink">
              {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-stone-500">Credit balance</dt>
            <dd className="mt-1 text-3xl font-black text-emerald-700">
              {formatCreditBalance(wallet?.balance ?? 0)}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={signOut}
          className="mt-6 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-black text-ink transition hover:bg-stone-100"
        >
          Sign out
        </button>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
          Business credits
        </p>
        <h2 className="mt-3 text-2xl font-black text-ink">
          Plans start at ${BUSINESS_DATA_CREDIT_BUNDLES.starter.priceUsd} for{" "}
          {formatCreditBalance(BUSINESS_DATA_CREDIT_BUNDLES.starter.credits)} credits
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Each processed business in a subscriber report costs 1 credit. Google Drive upload reuses
          your completed report at no extra credit charge.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm">
            <p className="font-bold text-stone-500">Lifetime credited</p>
            <p className="mt-1 text-2xl font-black text-ink">
              {formatCreditBalance(wallet?.lifetimeCredited ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm">
            <p className="font-bold text-stone-500">Lifetime used</p>
            <p className="mt-1 text-2xl font-black text-ink">
              {formatCreditBalance(wallet?.lifetimeDebited ?? 0)}
            </p>
          </div>
        </div>
        {wallet?.ledger?.length ? (
          <div className="mt-5 space-y-2">
            {wallet.ledger.slice(0, 5).map((entry) => (
              <div
                key={`${entry.created_at}-${entry.reason}`}
                className="rounded-xl border border-stone-200 px-4 py-3 text-sm"
              >
                <p className="font-bold text-ink">
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta} credits · {entry.reason}
                </p>
                <p className="text-xs text-stone-500">
                  Balance after: {formatCreditBalance(entry.balance_after)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {creditBundleOptions.map((bundle) => (
            <button
              key={bundle.id}
              type="button"
              onClick={() => void buyMoreCredits(bundle.id)}
              disabled={Boolean(buyingBundleId)}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:-translate-y-1 hover:border-emerald-400 hover:bg-white hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                {bundle.name}
              </p>
              <p className="mt-2 text-2xl font-black text-ink">${bundle.priceUsd}</p>
              <p className="mt-1 text-sm font-black text-emerald-800">
                {formatCreditBalance(bundle.credits)} credits
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-600">{bundle.description}</p>
              <span className="mt-3 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white">
                {buyingBundleId === bundle.id ? "Opening checkout..." : "Buy this pack"}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/business-data-generator"
            className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-black text-white transition hover:bg-stone-800"
          >
            Generate business data
          </Link>
        </div>
      </section>

      <ProfileReports />

      <section
        id="settings"
        className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
          Settings
        </p>
        <h2 className="mt-3 text-2xl font-black text-ink">Account settings</h2>
        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {message}
          </p>
        ) : null}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <label className="block text-sm font-black text-ink">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
              />
            </label>
            <button
              type="button"
              onClick={() => void saveDisplayName()}
              disabled={isSavingProfile}
              className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-black text-white transition hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-400"
            >
              {isSavingProfile ? "Saving..." : "Save display name"}
            </button>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-sm font-black text-ink">Password</p>
            {isEmailProvider ? (
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
                />
                <button
                  type="button"
                  onClick={() => void savePassword()}
                  disabled={isSavingPassword}
                  className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-black text-ink transition hover:bg-stone-100 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSavingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Password changes are managed by your {formatAuthProviderLabel(user.provider)} sign-in
                provider.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
