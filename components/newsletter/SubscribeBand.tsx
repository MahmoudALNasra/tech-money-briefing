"use client";

import { useRef, useState, useTransition } from "react";

import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { useDataLayer } from "@/hooks/useDataLayer";
import ScrollReveal from "@/components/ui/ScrollReveal";

type SubscribeBandProps = {
  placementIndex?: number;
  source?: string;
};

export function SubscribeBand({
  placementIndex = 9,
  source = "subscribe_band"
}: SubscribeBandProps) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
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

  return (
    <div className="subscribe-band">
      <div className="subscribe-band-inner">
        <div className="subscribe-copy">
          <p className="subscribe-eyebrow">Executive Briefing</p>
          <ScrollReveal
            containerClassName="subscribe-headline"
            textClassName="subscribe-headline-text"
            baseOpacity={0}
            enableBlur
            baseBlur={4}
          >
            Get the industry signals your competitors will read next week.
          </ScrollReveal>
          <p className="subscribe-sub">
            A concise B2B briefing with analyst context, operational implications,
            and the highest-signal source links from this niche.
          </p>
        </div>
        <form ref={formRef} action={onSubmit} className="subscribe-form">
          <input type="hidden" name="source" value={source} />
          <input
            required
            type="email"
            name="email"
            className="subscribe-input"
            placeholder="work@email.com"
            aria-label="Email address"
            disabled={isPending}
          />
          <button type="submit" className="subscribe-btn" disabled={isPending}>
            {isPending ? "Joining..." : "Join Free"}
          </button>
        </form>
      </div>
      {message ? (
        <p className={`subscribe-message ${message.ok ? "is-success" : "is-error"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
