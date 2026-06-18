"use client";

import { useState } from "react";

type InsightsCitationBlockProps = {
  citation: string;
};

export function InsightsCitationBlock({ citation }: InsightsCitationBlockProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-dim)]">
        Cite this stat
      </p>
      <blockquote className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">
        {citation}
      </blockquote>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(citation);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
        className="mt-3 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text-secondary)] transition hover:border-white/30 hover:text-white"
      >
        {copied ? "Copied" : "Copy citation"}
      </button>
    </div>
  );
}
