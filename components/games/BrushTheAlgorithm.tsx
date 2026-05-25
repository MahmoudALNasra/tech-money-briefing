"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";

type GameState = {
  score: number;
  best: number;
  anger: number;
  isPlaying: boolean;
  message: string;
  pulse: boolean;
};

const INITIAL_GAME: GameState = {
  score: 0,
  best: 0,
  anger: 18,
  isPlaying: true,
  message: "Brush the algorithm before it gets weird.",
  pulse: false
};

const messages = [
  "The algorithm accepts your offering.",
  "A tiny ranking factor sneezed.",
  "The feed is briefly moisturized.",
  "One less content tangle.",
  "The gremlin is suspiciously calm.",
  "You found a hidden engagement metric.",
  "The brush has entered product-market fit."
];

function moodLabel(anger: number) {
  if (anger > 80) {
    return "furious";
  }

  if (anger > 55) {
    return "itchy";
  }

  if (anger > 30) {
    return "suspicious";
  }

  return "smooth";
}

export function BrushTheAlgorithm() {
  const [game, setGame] = useState<GameState>(() => ({
    ...INITIAL_GAME,
    best:
      typeof window === "undefined"
        ? 0
        : Number(window.localStorage.getItem("brush-algorithm-best") ?? 0)
  }));

  const brushPower = useMemo(() => 1 + Math.floor(game.score / 35), [game.score]);

  useEffect(() => {
    if (!game.isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      setGame((current) => {
        const nextAnger = Math.min(
          100,
          current.anger + 0.55 + current.score / 900
        );

        if (nextAnger >= 100) {
          return {
            ...current,
            anger: 100,
            isPlaying: false,
            pulse: false,
            message: "Game over. The algorithm bit the brush."
          };
        }

        return {
          ...current,
          anger: nextAnger,
          pulse: false
        };
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [game.isPlaying]);

  useEffect(() => {
    window.localStorage.setItem("brush-algorithm-best", String(game.best));
  }, [game.best]);

  function brush() {
    setGame((current) => {
      const score = current.isPlaying ? current.score + brushPower : 1;
      const best = Math.max(current.best, score);
      const message =
        score % 25 === 0
          ? messages[Math.floor(score / 25) % messages.length]
          : current.message;

      return {
        score,
        best,
        anger: Math.max(0, current.isPlaying ? current.anger - 2.5 : 18),
        isPlaying: true,
        message,
        pulse: true
      };
    });
  }

  function reset() {
    setGame((current) => ({
      ...INITIAL_GAME,
      best: current.best
    }));
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-ink p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
            Very Serious Internet Game
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Brush the Algorithm
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Move your mouse or finger over the gremlin. Keep brushing before
            the rage meter fills. There is no strategy. Only brushing.
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Score
            </p>
            <p className="mt-1 text-3xl font-black text-ink">{game.score}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Best
            </p>
            <p className="mt-1 text-3xl font-black text-ink">{game.best}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Mood
            </p>
            <p className="mt-1 text-3xl font-black text-ink">
              {moodLabel(game.anger)}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-stone-500">
            <span>Algorithm rage</span>
            <span>{Math.round(game.anger)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all"
              style={{ width: `${game.anger}%` }}
            />
          </div>

          <button
            type="button"
            onPointerDown={brush}
            onPointerMove={brush}
            className="mt-6 w-full touch-none select-none rounded-[2rem] border border-stone-200 bg-gradient-to-br from-blue-50 via-white to-stone-100 p-6 text-center shadow-inner transition active:scale-[0.99]"
          >
            <div
              className={`mx-auto flex h-56 max-w-sm flex-col items-center justify-center rounded-[2rem] border-4 border-ink bg-white text-ink shadow-lg transition ${
                game.pulse ? "scale-[1.03] rotate-1" : "scale-100 rotate-0"
              }`}
            >
              <div className="relative h-24 w-36 rounded-[45%] bg-ink">
                <span className="absolute left-7 top-8 h-5 w-5 rounded-full bg-white" />
                <span className="absolute right-7 top-8 h-5 w-5 rounded-full bg-white" />
                <span
                  className={`absolute left-1/2 top-14 h-2 w-12 -translate-x-1/2 rounded-full bg-white transition ${
                    game.anger > 65 ? "rotate-12" : ""
                  }`}
                />
                <span className="absolute -left-5 top-5 h-12 w-8 -rotate-12 rounded-full bg-ink" />
                <span className="absolute -right-5 top-5 h-12 w-8 rotate-12 rounded-full bg-ink" />
              </div>
              <p className="mt-5 text-lg font-black">BRUSH AREA</p>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                +{brushPower} per brush
              </p>
            </div>
          </button>

          <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm font-semibold leading-6 text-stone-700">
            {game.message}
          </div>

          {!game.isPlaying ? (
            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
            >
              Brush again
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
        <p className="text-sm font-semibold text-stone-600">
          If the algorithm survives, reward yourself with actual briefings.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700"
          >
            Latest briefings
          </Link>
          <Link
            href="/ai-tools"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ink"
          >
            AI Tools
          </Link>
          <Link
            href="/seo"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ink"
          >
            SEO
          </Link>
        </div>
      </section>

      <NewsletterCapture
        placementIndex={100}
        source="brush_the_algorithm"
        variant="compact"
      />
    </div>
  );
}
