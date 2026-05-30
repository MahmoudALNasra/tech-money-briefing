"use client";

import { useRef, useState, useTransition } from "react";

import { submitMonetizationAudit } from "@/app/actions/monetization-audit";
import { useDataLayer } from "@/hooks/useDataLayer";

type MonetizationAuditFormProps = {
  source?: string;
};

const goals = [
  { value: "ads", label: "Display ads (AdSense, networks)" },
  { value: "affiliate", label: "Affiliate and referral revenue" },
  { value: "newsletter", label: "Newsletter and email monetization" },
  { value: "sponsorship", label: "Sponsorships and partner placements" },
  { value: "mixed", label: "Mixed stack (not sure yet)" },
  { value: "other", label: "Other / exploring" }
];

export function MonetizationAuditForm({
  source = "audit_form"
}: MonetizationAuditFormProps) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const pushToDataLayer = useDataLayer();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitMonetizationAudit(formData);

      setMessage({
        ok: result.ok,
        text: result.message
      });

      if (result.ok) {
        formRef.current?.reset();
        pushToDataLayer({
          event: "monetization_audit_submit",
          source
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <input type="hidden" name="source" value={source} />

      <div>
        <label htmlFor="audit-site-url" className="text-sm font-bold text-ink">
          Site URL
        </label>
        <input
          id="audit-site-url"
          name="site_url"
          type="url"
          required
          placeholder="https://yoursite.com"
          disabled={isPending}
          className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm text-ink outline-none ring-stone-200 transition focus:ring-4"
        />
      </div>

      <div>
        <label htmlFor="audit-email" className="text-sm font-bold text-ink">
          Work email
        </label>
        <input
          id="audit-email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          disabled={isPending}
          className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm text-ink outline-none ring-stone-200 transition focus:ring-4"
        />
      </div>

      <div>
        <label htmlFor="audit-goal" className="text-sm font-bold text-ink">
          Primary goal
        </label>
        <select
          id="audit-goal"
          name="goal"
          required
          disabled={isPending}
          className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-ink outline-none ring-stone-200 transition focus:ring-4"
          defaultValue=""
        >
          <option value="" disabled>
            Choose one
          </option>
          {goals.map((goal) => (
            <option key={goal.value} value={goal.value}>
              {goal.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="audit-notes" className="text-sm font-bold text-ink">
          What is not working? (optional)
        </label>
        <textarea
          id="audit-notes"
          name="notes"
          rows={4}
          disabled={isPending}
          placeholder="Example: traffic but low RPM, no email capture, affiliate links with no clicks..."
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-ink outline-none ring-stone-200 transition focus:ring-4"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? "Submitting..." : "Request free audit"}
      </button>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            message.ok
              ? "bg-emerald-50 text-emerald-950"
              : "bg-red-50 text-red-950"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </form>
  );
}
