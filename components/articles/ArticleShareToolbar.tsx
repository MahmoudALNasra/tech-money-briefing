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
    <aside className="mt-6 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
            Share This Briefing
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Send it to a community, teammate, or your own notes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-ink transition hover:border-ink"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-ink transition hover:border-ink"
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
              className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-700 transition hover:bg-ink hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
