"use client";

import { useRef, useState, useTransition } from "react";

import { submitContactForm } from "@/app/actions/contact";
import { useDataLayer } from "@/hooks/useDataLayer";

type ContactFormProps = {
  source?: string;
};

const contactTopics = [
  { value: "help", label: "I need help finding the right tool or next step" },
  { value: "strategy", label: "I want help with SEO, monetization, or content strategy" },
  { value: "correction", label: "Correction or article feedback" },
  { value: "source", label: "Source suggestion" },
  { value: "sponsorship", label: "Sponsorship or advertising" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" }
];

export function ContactForm({ source = "contact_page" }: ContactFormProps) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const pushToDataLayer = useDataLayer();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitContactForm(formData);

      setMessage({
        ok: result.ok,
        text: result.message
      });

      if (result.ok && result.emailSent !== false) {
        formRef.current?.reset();
      }

      if (result.saved) {
        pushToDataLayer({
          event: "contact_form_submit",
          source
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="not-prose space-y-5 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <input type="hidden" name="source" value={source} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-bold text-ink">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            disabled={isPending}
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none ring-stone-200 transition focus:ring-4"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="text-sm font-bold text-ink">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            disabled={isPending}
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none ring-stone-200 transition focus:ring-4"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-company" className="text-sm font-bold text-ink">
            Company or site (optional)
          </label>
          <input
            id="contact-company"
            name="company"
            disabled={isPending}
            placeholder="yourdomain.com"
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none ring-stone-200 transition focus:ring-4"
          />
        </div>
        <div>
          <label htmlFor="contact-page-url" className="text-sm font-bold text-ink">
            Relevant page URL (optional)
          </label>
          <input
            id="contact-page-url"
            name="page_url"
            type="url"
            disabled={isPending}
            placeholder="https://techrevenuebrief.com/..."
            className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 px-4 text-sm outline-none ring-stone-200 transition focus:ring-4"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="text-sm font-bold text-ink">
          What do you need?
        </label>
        <select
          id="contact-topic"
          name="topic"
          required
          disabled={isPending}
          defaultValue="help"
          className="mt-2 min-h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none ring-stone-200 transition focus:ring-4"
        >
          {contactTopics.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm font-bold text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          rows={6}
          disabled={isPending}
          placeholder="Tell us what you are trying to solve, what page/tool you were looking at, and what outcome you want."
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm outline-none ring-stone-200 transition focus:ring-4"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Sending..." : "Send to info@techrevenuebrief.com"}
      </button>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            message.ok
              ? "bg-emerald-50 text-emerald-950"
              : message.text.startsWith("Saved")
                ? "bg-amber-50 text-amber-950"
              : "bg-red-50 text-red-950"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </form>
  );
}
