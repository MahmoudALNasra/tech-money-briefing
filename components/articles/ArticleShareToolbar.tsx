"use client";

import { useMemo, useState } from "react";

type ArticleShareToolbarProps = {
  title: string;
  url: string;
};

function shareLabel(platform: string) {
  return `Share on ${platform}`;
}

export function ArticleShareToolbar({ title, url }: ArticleShareToolbarProps) {
  const [copied, setCopied] = useState(false);
  const links = useMemo(() => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n\n${url}`);

    return [
      {
        label: "X",
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        ariaLabel: shareLabel("X")
      },
      {
        label: "LinkedIn",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        ariaLabel: shareLabel("LinkedIn")
      },
      {
        label: "Reddit",
        href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        ariaLabel: shareLabel("Reddit")
      },
      {
        label: "Email",
        href: `mailto:?subject=${encodedTitle}&body=${body}`,
        ariaLabel: "Share by email"
      }
    ];
  }, [title, url]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({ title, url });
    } catch {
      // The user can cancel the native share sheet; no UI change needed.
    }
  }

  return (
    <aside className="share-briefing-card mt-6 rounded-md border border-white/[0.06] bg-[var(--bg-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-blue)]">
            Share This Briefing
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Send it to a community, teammate, or your own notes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-[3px] border border-white/[0.06] px-4 py-2 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--border-accent)]"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-[3px] border border-white/[0.06] px-4 py-2 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--border-accent)]"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.label === "Email" ? undefined : "_blank"}
              rel={link.label === "Email" ? undefined : "noopener noreferrer"}
              aria-label={link.ariaLabel}
              className="rounded-[3px] bg-white/[0.04] px-4 py-2 text-sm font-bold text-[var(--text-secondary)] transition hover:bg-[var(--accent-blue)] hover:text-[var(--bg-base)]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
