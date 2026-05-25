"use client";

import Link from "next/link";
import type { PointerEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";

type GamePhase = "calm" | "danger" | "bitten";

type GameState = {
  score: number;
  best: number;
  anger: number;
  dangerProgress: number;
  phase: GamePhase;
  message: string;
  pulse: boolean;
};

type PointerPosition = {
  x: number;
  y: number;
  active: boolean;
};

const INITIAL_GAME: GameState = {
  score: 0,
  best: 0,
  anger: 18,
  dangerProgress: 0,
  phase: "calm",
  message: "Brush the algorithm before it notices you.",
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

function moodLabel(phase: GamePhase, anger: number) {
  if (phase === "bitten") {
    return "chomped";
  }

  if (phase === "danger") {
    return "staring";
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
  const [pointer, setPointer] = useState<PointerPosition>({
    x: 0,
    y: 0,
    active: false
  });

  const brushPower = useMemo(() => 1 + Math.floor(game.score / 35), [game.score]);
  const isDanger = game.phase === "danger";
  const isBitten = game.phase === "bitten";

  useEffect(() => {
    if (game.phase === "bitten") {
      return;
    }

    const interval = window.setInterval(() => {
      setGame((current) => {
        if (current.phase === "danger") {
          const nextProgress = current.dangerProgress + 3.4;

          if (nextProgress >= 100) {
            return {
              ...current,
              dangerProgress: 100,
              phase: "bitten",
              pulse: false,
              message: "CHOMP. The algorithm bit the brush."
            };
          }

          return {
            ...current,
            dangerProgress: nextProgress,
            pulse: false
          };
        }

        const nextAnger = current.anger + 0.7 + current.score / 850;

        if (nextAnger >= 100) {
          return {
            ...current,
            anger: 100,
            dangerProgress: 0,
            phase: "danger",
            pulse: false,
            message: "DANGER. It is looking at you. Brush fast."
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
  }, [game.phase]);

  useEffect(() => {
    window.localStorage.setItem("brush-algorithm-best", String(game.best));
  }, [game.best]);

  function updatePointer(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    setPointer({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true
    });
  }

  function brush(event?: PointerEvent<HTMLElement>) {
    if (event) {
      updatePointer(event);
    }

    setGame((current) => {
      if (current.phase === "bitten") {
        const score = 1;

        return {
          ...INITIAL_GAME,
          score,
          best: Math.max(current.best, score),
          pulse: true,
          message: "New brush. Same bad decision."
        };
      }

      const score = current.score + brushPower;
      const best = Math.max(current.best, score);
      const message =
        score % 25 === 0
          ? messages[Math.floor(score / 25) % messages.length]
          : current.message;

      if (current.phase === "danger") {
        const nextProgress = Math.max(0, current.dangerProgress - 10);

        if (nextProgress === 0) {
          return {
            score,
            best,
            anger: 22,
            dangerProgress: 0,
            phase: "calm",
            message: "You survived. It forgot why it was mad.",
            pulse: true
          };
        }

        return {
          ...current,
          score,
          best,
          dangerProgress: nextProgress,
          message: "It is still staring. Do not stop brushing.",
          pulse: true
        };
      }

      return {
        ...current,
        score,
        best,
        anger: Math.max(0, current.anger - 2.2),
        phase: "calm",
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
              {moodLabel(game.phase, game.anger)}
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
          {isDanger ? (
            <>
              <div className="mb-3 mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-red-600">
                <span>Bite warning</span>
                <span>{Math.round(game.dangerProgress)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full rounded-full bg-red-600 transition-all"
                  style={{ width: `${game.dangerProgress}%` }}
                />
              </div>
            </>
          ) : null}

          <button
            type="button"
            onPointerDown={brush}
            onPointerMove={(event) => {
              updatePointer(event);
              if (event.buttons === 1 || isDanger) {
                brush(event);
              }
            }}
            onPointerLeave={() =>
              setPointer((current) => ({ ...current, active: false }))
            }
            className={`relative mt-6 w-full touch-none select-none overflow-hidden rounded-[2rem] border p-6 text-center shadow-inner transition active:scale-[0.99] ${
              isDanger
                ? "cursor-none border-red-300 bg-gradient-to-br from-red-50 via-white to-amber-50"
                : "cursor-none border-stone-200 bg-gradient-to-br from-blue-50 via-white to-stone-100"
            }`}
          >
            {pointer.active ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute z-20 h-16 w-16 -translate-x-4 -translate-y-12 rotate-[-28deg]"
                style={{ left: pointer.x, top: pointer.y }}
              >
                <span className="absolute left-7 top-0 h-12 w-3 rounded-full bg-amber-700 shadow-sm" />
                <span className="absolute left-4 top-10 h-5 w-9 rounded-b-2xl rounded-t-md bg-sky-400" />
                <span className="absolute left-5 top-14 h-2 w-7 rounded-full bg-sky-200" />
              </span>
            ) : null}
            <div
              className={`mx-auto flex h-64 max-w-sm flex-col items-center justify-center rounded-[2rem] border-4 bg-white text-ink shadow-lg transition ${
                isDanger
                  ? "border-red-600 shadow-red-200"
                  : "border-ink shadow-stone-200"
              } ${game.pulse ? "scale-[1.03] rotate-1" : "scale-100 rotate-0"} ${
                isBitten ? "translate-y-2 scale-95" : ""
              }`}
            >
              <div
                className={`relative h-28 w-40 rounded-[45%] transition ${
                  isBitten ? "bg-red-950" : isDanger ? "bg-red-900" : "bg-ink"
                }`}
              >
                <span className="absolute -left-5 top-5 h-12 w-8 -rotate-12 rounded-full bg-current" />
                <span className="absolute -right-5 top-5 h-12 w-8 rotate-12 rounded-full bg-current" />
                <span
                  className={`absolute left-8 top-9 h-6 w-6 rounded-full bg-white ${
                    isDanger ? "animate-pulse" : ""
                  }`}
                >
                  <span
                    className={`absolute h-2.5 w-2.5 rounded-full bg-ink transition ${
                      isDanger
                        ? "left-2 top-1.5"
                        : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    }`}
                  />
                </span>
                <span
                  className={`absolute right-8 top-9 h-6 w-6 rounded-full bg-white ${
                    isDanger ? "animate-pulse" : ""
                  }`}
                >
                  <span
                    className={`absolute h-2.5 w-2.5 rounded-full bg-ink transition ${
                      isDanger
                        ? "right-2 top-1.5"
                        : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    }`}
                  />
                </span>
                {isBitten ? (
                  <span className="absolute left-1/2 top-16 h-9 w-20 -translate-x-1/2 rounded-b-full bg-white">
                    <span className="absolute left-2 top-0 h-4 w-3 bg-red-950 [clip-path:polygon(50%_100%,0_0,100%_0)]" />
                    <span className="absolute left-7 top-0 h-4 w-3 bg-red-950 [clip-path:polygon(50%_100%,0_0,100%_0)]" />
                    <span className="absolute right-7 top-0 h-4 w-3 bg-red-950 [clip-path:polygon(50%_100%,0_0,100%_0)]" />
                    <span className="absolute right-2 top-0 h-4 w-3 bg-red-950 [clip-path:polygon(50%_100%,0_0,100%_0)]" />
                  </span>
                ) : (
                  <span
                    className={`absolute left-1/2 top-[4.25rem] h-2 w-14 -translate-x-1/2 rounded-full bg-white transition ${
                      isDanger ? "rotate-12 scale-x-75" : ""
                    }`}
                  />
                )}
              </div>
              <p className="mt-5 text-lg font-black">
                {isBitten
                  ? "IT BIT YOU"
                  : isDanger
                    ? "DANGER: BRUSH FAST"
                    : "BRUSH AREA"}
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-500">
                {isDanger
                  ? "Calm it before the bite meter fills"
                  : `+${brushPower} per brush`}
              </p>
            </div>
          </button>

          <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm font-semibold leading-6 text-stone-700">
            {game.message}
          </div>

          {isBitten ? (
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
