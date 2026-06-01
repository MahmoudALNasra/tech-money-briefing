"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
  label?: string;
};

export function BackButton({
  fallbackHref,
  label = "Back"
}: BackButtonProps) {
  const router = useRouter();

  function onClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-stone-600 shadow-sm transition hover:border-stone-400 hover:text-ink"
      aria-label={label}
    >
      <span aria-hidden="true">{"<"}</span>
      {label}
    </button>
  );
}

export function BackLinkFallback({
  fallbackHref,
  label = "Back"
}: BackButtonProps) {
  return (
    <Link
      href={fallbackHref}
      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-stone-600 shadow-sm transition hover:border-stone-400 hover:text-ink"
    >
      <span aria-hidden="true">{"<"}</span>
      {label}
    </Link>
  );
}
