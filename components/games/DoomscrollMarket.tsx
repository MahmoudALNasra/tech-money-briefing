"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Card = {
  label: string;
  kind: "buy" | "dodge";
};

const cards: Card[] = [
  { label: "AI tool with real users", kind: "buy" },
  { label: "SEO signal", kind: "buy" },
  { label: "newsletter subscriber", kind: "buy" },
  { label: "fake guru thread", kind: "dodge" },
  { label: "bot traffic spike", kind: "dodge" },
  { label: "course bro funnel", kind: "dodge" },
  { label: "creator trend", kind: "buy" },
  { label: "ragebait screenshot", kind: "dodge" }
];

function pickCard() {
  return cards[Math.floor(Math.random() * cards.length)];
}

export function DoomscrollMarket() {
  const [card, setCard] = useState<Card>(() => pickCard());
  const [score, setScore] = useState(0);
  const [brainrot, setBrainrot] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [message, setMessage] = useState("Buy good signals. Dodge brainrot. The feed moves fast.");
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    if (isOver) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        const next = current - 4;

        if (next <= 0) {
          setBrainrot((b) => {
            const nextBrainrot = Math.min(100, b + 15);
            if (nextBrainrot >= 100) {
              setIsOver(true);
              setMessage("The feed won. You bought every bad take.");
            } else {
              setMessage("Too slow. The feed punished hesitation.");
              setCard(pickCard());
            }
            return nextBrainrot;
          });

          return 100;
        }

        return next;
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [isOver]);

  function answer(choice: Card["kind"]) {
    if (isOver) {
      return;
    }

    const correct = choice === card.kind;

    if (correct) {
      setScore((current) => current + 10);
      setBrainrot((current) => Math.max(0, current - 6));
      setMessage(
        card.kind === "buy"
          ? `Bought: ${card.label}. Signal secured.`
          : `Dodged: ${card.label}. Brain saved.`
      );
    } else {
      setBrainrot((current) => {
        const next = Math.min(100, current + 22);
        if (next >= 100) {
          setIsOver(true);
          setMessage("Your portfolio is 100% brainrot.");
        } else {
          setMessage(`Wrong move. ${card.label} damaged the timeline.`);
        }
        return next;
      });
    }

    setCard(pickCard());
    setTimeLeft(100);
  }

  function reset() {
    setCard(pickCard());
    setScore(0);
    setBrainrot(0);
    setTimeLeft(100);
    setMessage("Buy good signals. Dodge brainrot. The feed moves fast.");
    setIsOver(false);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-ink p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
            Combined Chaos Mode
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Doomscroll Meme Market
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            A card flies into your feed. Decide fast: buy the signal or dodge
            the brainrot.
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <Stat label="Score" value={score} />
          <Stat label="Brainrot" value={`${brainrot}%`} />
          <Stat label="Timer" value={`${timeLeft}%`} />
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="h-3 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${timeLeft}%` }}
            />
          </div>

          <div
            className={`mt-6 rounded-[2rem] border-4 p-8 text-center shadow-lg ${
              card.kind === "buy"
                ? "border-emerald-500 bg-emerald-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-500">
              Incoming feed object
            </p>
            <h3 className="mt-4 text-4xl font-black leading-tight text-ink">
              {card.label}
            </h3>
            <p className="mt-4 text-sm font-semibold text-stone-600">
              Is this signal or brainrot?
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => answer("buy")}
              className="rounded-full bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700"
            >
              Buy Signal
            </button>
            <button
              type="button"
              onClick={() => answer("dodge")}
              className="rounded-full bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-700"
            >
              Dodge Brainrot
            </button>
          </div>

          <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            {message}
          </p>

          {isOver ? (
            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
            >
              Reset timeline
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
        <p className="text-sm font-semibold text-stone-600">
          Need more nonsense?
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/doomscroll-dodge"
            className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
          >
            Doomscroll Dodge
          </Link>
          <Link
            href="/meme-market"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-ink"
          >
            Meme Market
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}
