"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { LoadingMascot } from "@/components/business-data/LoadingMascot";
import type { LoadingSuggestion } from "@/lib/business-data-loading-suggestions";

type ExportLoadingOverlayProps = {
  category: string;
  location: string;
  title: string;
  subtitle?: string;
  completedFile?: {
    name: string;
    url: string;
  } | null;
  onClose?: () => void;
  resultCount?: number;
  processedCount?: number;
  requestedCount?: number;
  cancellable?: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
};

export function ExportLoadingOverlay({
  category,
  location,
  title,
  subtitle = "Please keep this page open while we finish the subscriber report.",
  completedFile = null,
  onClose,
  resultCount = 0,
  processedCount = 0,
  requestedCount = 0,
  cancellable = false,
  onCancel,
  isCancelling = false
}: ExportLoadingOverlayProps) {
  const [suggestions, setSuggestions] = useState<LoadingSuggestion[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const carouselItems = useMemo(
    () => (suggestions.length ? [...suggestions, ...suggestions] : []),
    [suggestions]
  );
  const progressTotal = requestedCount || resultCount;
  const estimatedSeconds = Math.max(45, Math.min(240, 30 + progressTotal * 3));
  const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      try {
        const params = new URLSearchParams({
          category,
          location
        });
        const response = await fetch(
          `/api/business-data/loading-suggestions?${params.toString()}`
        );
        const json = (await response.json()) as { suggestions?: LoadingSuggestion[] };

        if (!cancelled) {
          setSuggestions(json.suggestions ?? []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      }
    }

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [category, location]);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (completedFile) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-6 text-center shadow-2xl sm:p-8">
          <LoadingMascot
            label="Your Google Drive export is ready"
            description="The workbook finished uploading. You can open the new file in Google Drive now, or stay here and keep working."
          />
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
              New file name
            </p>
            <p className="mt-2 break-words text-sm font-black text-emerald-950">
              {completedFile.name}
            </p>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={completedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Open Google Drive
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-black text-ink transition hover:bg-stone-100"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
        <LoadingMascot
          label={title}
          description="The cat-bot is gathering clues, comparing business signals, and turning the findings into a subscriber-ready report."
        />
        <p className="mt-2 text-center text-sm font-semibold text-rose-600">
          {subtitle}
        </p>
        {progressTotal > 0 ? (
          <p className="mt-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            Processed {processedCount} of {progressTotal} businesses
          </p>
        ) : null}
        <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3 text-center text-xs">
          <div className="rounded-2xl bg-stone-100 p-3">
            <p className="font-black text-ink">{formatDuration(elapsedSeconds)}</p>
            <p className="mt-1 text-stone-500">elapsed</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="font-black text-emerald-800">
              {remainingSeconds > 0 ? `~${formatDuration(remainingSeconds)}` : "Almost done"}
            </p>
            <p className="mt-1 text-emerald-700">estimated remaining</p>
          </div>
        </div>

        {cancellable ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
            >
              {isCancelling ? "Cancelling..." : "Cancel report"}
            </button>
          </div>
        ) : null}

        {carouselItems.length > 0 ? (
          <div className="mt-8 overflow-hidden">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.24em] text-stone-400">
              While you wait, explore related guides and tools
            </p>
            <div className="relative">
              <div className="flex w-max animate-[business-data-carousel_40s_linear_infinite] gap-3">
                {carouselItems.map((item, index) => (
                  <a
                    key={`${item.href}-${index}`}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-200">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                          {item.type === "tool" ? "Tool" : "Guide"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-stone-500">
                        {item.subtitle}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
