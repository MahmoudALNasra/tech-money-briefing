"use client";

import { useRef, useState, useTransition } from "react";

import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { useDataLayer } from "@/hooks/useDataLayer";

type NewsletterCaptureProps = {
  placementIndex: number;
  source?: string;
  variant?: "default" | "compact";
};

export function NewsletterCapture({
  placementIndex,
  source = "homepage_grid",
  variant = "default"
}: NewsletterCaptureProps) {
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const pushToDataLayer = useDataLayer();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);

      setMessage({
        ok: result.ok,
        text: result.message
      });

      if (result.ok) {
        formRef.current?.reset();
        pushToDataLayer({
          event: "newsletter_signup",
          placement_index: placementIndex,
          source
        });
      }
    });
  }

  const isCompact = variant === "compact";

  return (
    <aside
      className={`rounded-2xl border border-ink bg-ink text-white shadow-sm ${
        isCompact ? "p-5" : "p-6"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-300">
        Executive Briefing
      </p>
      <h2
        className={`mt-3 font-black leading-tight tracking-tight ${
          isCompact ? "text-lg" : "mt-4 max-w-xl text-2xl"
        }`}
      >
        {isCompact
          ? "Get revenue signals in your inbox."
          : "Get the industry signals your competitors will read next week."}
      </h2>
      {!isCompact ? (
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300">
          A concise B2B briefing with analyst context, operational implications,
          and the highest-signal source links from this niche.
        </p>
      ) : null}

      <form
        ref={formRef}
        action={onSubmit}
        className={`mt-4 flex flex-col gap-3 ${isCompact ? "" : "sm:flex-row"}`}
      >
        <input type="hidden" name="source" value={source} />
        <label className="sr-only" htmlFor={`newsletter-email-${placementIndex}`}>
          Work email
        </label>
        <input
          id={`newsletter-email-${placementIndex}`}
          required
          type="email"
          name="email"
          placeholder="work@email.com"
          disabled={isPending}
          className="min-h-12 flex-1 rounded-full border border-white/20 bg-white px-4 text-sm text-ink outline-none ring-white/30 transition placeholder:text-gray-500 focus:ring-4"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-12 rounded-full bg-white px-6 text-sm font-bold text-ink transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Joining..." : "Join Free"}
        </button>
      </form>
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            message.ok
              ? "bg-emerald-100 text-emerald-950"
              : "bg-red-100 text-red-950"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </aside>
  );
}
