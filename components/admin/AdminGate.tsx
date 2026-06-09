"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AdminGateStatus =
  | "loading"
  | "mfa_setup"
  | "mfa_challenge"
  | "allowed"
  | "forbidden";

export function AdminGate() {
  const router = useRouter();
  const [status, setStatus] = useState<AdminGateStatus>("loading");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [forbiddenMessage, setForbiddenMessage] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");

  const handleAdminAccessResponse = async (
    response: Response,
    sessionEmail?: string | null
  ) => {
    if (response.ok) {
      setStatus("allowed");
      return;
    }

    const json = (await response.json().catch(() => ({}))) as {
      error?: string;
      email?: string | null;
    };

    setSignedInEmail(json.email ?? sessionEmail ?? "");
    setForbiddenMessage(
      json.error ??
        (response.status === 500
          ? "Admin access is not configured. Add ADMIN_EMAILS to your environment and restart the app."
          : "This account is not authorized for admin access.")
    );
    setStatus("forbidden");
  };

  useEffect(() => {
    async function checkAccess() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          router.replace("/login?next=/admin");
          return;
        }

        const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance.error) {
          throw assurance.error;
        }

        if (assurance.data.currentLevel !== "aal2") {
          const factors = await supabase.auth.mfa.listFactors();
          if (factors.error) {
            throw factors.error;
          }

          const verifiedFactor = factors.data.totp.find(
            (factor) => factor.status === "verified"
          );

          if (verifiedFactor) {
            setFactorId(verifiedFactor.id);
            setStatus("mfa_challenge");
            return;
          }

          const enrollment = await supabase.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: "Tech Revenue Brief Admin"
          });

          if (enrollment.error) {
            throw enrollment.error;
          }

          setFactorId(enrollment.data.id);
          setQrCode(enrollment.data.totp.qr_code);
          setTotpSecret(enrollment.data.totp.secret);
          setStatus("mfa_setup");
          return;
        }

        const response = await fetch("/api/admin/users?limit=1", {
          headers: await getBusinessDataAuthHeaders()
        });

        if (!response.ok) {
          await handleAdminAccessResponse(response, data.session.user.email);
          return;
        }

        setStatus("allowed");
      } catch (error) {
        setForbiddenMessage(
          error instanceof Error ? error.message : "Could not verify admin access."
        );
        setStatus("forbidden");
      }
    }

    void checkAccess();
  }, [router]);

  const verifyMfaCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const code = verificationCode.replace(/\D/g, "");

    if (!factorId || code.length !== 6) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const challenge = challengeId
        ? { id: challengeId }
        : await supabase.auth.mfa.challenge({ factorId });

      if ("error" in challenge && challenge.error) {
        throw challenge.error;
      }

      const nextChallengeId = "id" in challenge ? challenge.id : challenge.data.id;
      setChallengeId(nextChallengeId);

      const verified = await supabase.auth.mfa.verify({
        factorId,
        challengeId: nextChallengeId,
        code
      });

      if (verified.error) {
        throw verified.error;
      }

      setVerificationCode("");

      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/users?limit=1", {
        headers: await getBusinessDataAuthHeaders()
      });

      if (!response.ok) {
        await handleAdminAccessResponse(response, sessionData.session?.user.email);
        return;
      }

      setStatus("allowed");
    } catch (error) {
      setStatus(qrCode ? "mfa_setup" : "mfa_challenge");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  if (status === "loading") {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-emerald-400" />
        <p className="mt-4 text-sm font-bold text-stone-700">Verifying secure access...</p>
      </div>
    );
  }

  if (status === "mfa_setup" || status === "mfa_challenge") {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
          Secure verification
        </p>
        <h1 className="mt-3 text-2xl font-black text-ink">
          {status === "mfa_setup"
            ? "Set up authenticator verification"
            : "Enter your authenticator code"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          Account operations require a one-time code from an authenticator app before confidential
          billing and credit controls are shown.
        </p>

        {status === "mfa_setup" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
            {qrCode ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <img
                  src={qrCode}
                  alt="Authenticator app QR code"
                  className="mx-auto h-44 w-44"
                />
              </div>
            ) : null}
            <div className="text-sm leading-6 text-stone-700">
              <p className="font-bold text-ink">How to set it up</p>
              <p className="mt-2">
                Open Google Authenticator, Microsoft Authenticator, 1Password, or another TOTP
                app. Scan the QR code, then enter the 6-digit code it shows.
              </p>
              {totpSecret ? (
                <p className="mt-3 break-all rounded-xl bg-stone-100 p-3 text-xs font-semibold text-stone-600">
                  Manual setup key: {totpSecret}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <form className="mt-6 space-y-3" onSubmit={verifyMfaCode}>
          <label className="block text-sm font-black text-ink">
            Authenticator code
            <input
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="mt-2 min-h-12 w-full max-w-xs rounded-2xl border border-stone-200 px-4 text-lg font-black tracking-[0.24em] text-stone-950 outline-none ring-emerald-200 transition focus:ring-4"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-3 text-sm font-black text-white transition hover:bg-stone-800"
          >
            Verify and continue
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
          Restricted area
        </p>
        <h1 className="mt-3 text-2xl font-black text-ink">Authorized access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          This workspace contains confidential account and billing controls. Admin access is
          granted only to emails listed in <code>ADMIN_EMAILS</code>.
        </p>
        {signedInEmail ? (
          <p className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            Signed in as <span className="font-black text-ink">{signedInEmail}</span>
          </p>
        ) : null}
        {forbiddenMessage ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {forbiddenMessage}
          </p>
        ) : null}
        <p className="mt-3 text-sm leading-6 text-stone-600">
          If you recreated this account after deleting it, make sure{" "}
          <code>ADMIN_EMAILS=info@techrevenuebrief.com</code> is set in Vercel and in your local{" "}
          <code>.env.local</code>, then redeploy or restart the dev server.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-black text-white transition hover:bg-stone-800"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return <AdminDashboard />;
}
