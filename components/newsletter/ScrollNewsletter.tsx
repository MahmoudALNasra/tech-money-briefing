"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { useDataLayer } from "@/hooks/useDataLayer";

const DISMISSED_KEY = "tech-revenue-brief-scroll-newsletter-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type Message = {
  ok: boolean;
  text: string;
};

export function ScrollNewsletter() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const pushToDataLayer = useDataLayer();

  useEffect(() => {
    const dismissedAt = Number.parseInt(
      window.localStorage.getItem(DISMISSED_KEY) ?? "0",
      10
    );

    setIsDismissed(dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION_MS);
  }, []);

  useEffect(() => {
    if (isDismissed) {
      return;
    }

    const articleBody = document.querySelector<HTMLElement>(".article-content");

    if (!articleBody) {
      return;
    }

    const target = articleBody;

    function updateVisibility() {
      const rect = target.getBoundingClientRect();
      const bodyTop = rect.top + window.scrollY;
      const halfwayPoint = bodyTop + rect.height * 0.5;
      const viewportBottom = window.scrollY + window.innerHeight;

      if (viewportBottom >= halfwayPoint) {
        setShouldShow(true);
        window.requestAnimationFrame(() => setIsVisible(true));
        window.removeEventListener("scroll", updateVisibility);
        window.removeEventListener("resize", updateVisibility);
      }
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [isDismissed]);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setIsVisible(false);
    setShouldShow(false);
    setIsDismissed(true);
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);

      setMessage({
        ok: result.ok,
        text: result.message
      });

      if (result.ok) {
        formRef.current?.reset();
        window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        pushToDataLayer({
          event: "newsletter_signup",
          source: "scroll_popup"
        });
      }
    });
  }

  if (!shouldShow || isDismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Newsletter signup"
      className={`fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-950/20 transition duration-300 ease-out sm:inset-x-auto sm:right-5 sm:max-w-sm ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close newsletter signup"
        className="absolute right-3 top-3 rounded-full px-2 py-1 text-sm font-bold text-stone-500 transition hover:bg-stone-100 hover:text-ink"
      >
        X
      </button>

      <p className="pr-8 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
        Stay Ahead
      </p>
      <h2 className="mt-2 pr-6 text-lg font-black leading-tight tracking-tight text-ink">
        Get revenue signals before they hit your feed.
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Join the free briefing for AI, SEO, fintech, ecommerce, and creator
        business moves worth acting on.
      </p>

      <form ref={formRef} action={onSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="source" value="scroll_popup" />
        <label className="sr-only" htmlFor="scroll-newsletter-email">
          Email address
        </label>
        <input
          id="scroll-newsletter-email"
          required
          type="email"
          name="email"
          placeholder="you@example.com"
          disabled={isPending}
          className="min-h-11 w-full rounded-full border border-stone-300 px-4 text-sm text-ink outline-none ring-ink/10 transition placeholder:text-stone-400 focus:ring-4"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full rounded-full bg-ink px-5 text-sm font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Joining..." : "Get the Briefing"}
        </button>
      </form>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
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
