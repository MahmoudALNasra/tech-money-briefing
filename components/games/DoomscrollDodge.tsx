"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FallingItem = {
  id: number;
  lane: number;
  row: number;
  type: "signal" | "brainrot";
  label: string;
};

const goodItems = ["AI tool", "SEO signal", "subscriber", "customer", "trend"];
const badItems = ["bot traffic", "fake guru", "ragebait", "AI slop", "policy hit"];

function randomItem(id: number): FallingItem {
  const isGood = Math.random() > 0.42;
  const list = isGood ? goodItems : badItems;

  return {
    id,
    lane: Math.floor(Math.random() * 3),
    row: 0,
    type: isGood ? "signal" : "brainrot",
    label: list[Math.floor(Math.random() * list.length)]
  };
}

export function DoomscrollDodge() {
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [brainrot, setBrainrot] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [message, setMessage] = useState("Dodge brainrot. Catch revenue signals.");

  const status = useMemo(() => {
    if (!isRunning) {
      return "feed collapsed";
    }

    if (brainrot > 70) {
      return "terminally online";
    }

    if (brainrot > 40) {
      return "doomscrolling";
    }

    return "locked in";
  }, [brainrot, isRunning]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        setLane((current) => Math.max(0, current - 1));
      }

      if (event.key === "ArrowRight") {
        setLane((current) => Math.min(2, current + 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let nextId = 1;
    const interval = window.setInterval(() => {
      setItems((current) => {
        const movedItems = current
          .map((item) => ({ ...item, row: item.row + 1 }))
          .filter((item) => item.row < 6);
        const hitItems = movedItems.filter(
          (item) => item.row === 5 && item.lane === lane
        );
        const moved = movedItems.filter((item) => !hitItems.includes(item));

        for (const item of hitItems) {
          if (item.type === "signal") {
            setScore((score) => score + 10);
            setBrainrot((currentBrainrot) => Math.max(0, currentBrainrot - 6));
            setMessage(`Caught: ${item.label}. The feed briefly made sense.`);
          } else {
            setBrainrot((currentBrainrot) => {
              const nextBrainrot = Math.min(100, currentBrainrot + 22);

              if (nextBrainrot >= 100) {
                setIsRunning(false);
                setMessage("Game over. The fake guru sold you a course.");
              } else {
                setMessage(`Hit by ${item.label}. Brainrot increased.`);
              }

              return nextBrainrot;
            });
          }
        }

        if (Math.random() > 0.35) {
          moved.push(randomItem(nextId));
          nextId += 1;
        }

        return moved;
      });
    }, 520);

    return () => window.clearInterval(interval);
  }, [isRunning, lane]);

  function reset() {
    setLane(1);
    setItems([]);
    setScore(0);
    setBrainrot(0);
    setIsRunning(true);
    setMessage("Dodge brainrot. Catch revenue signals.");
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-ink p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
            Doomscroll Mini Game
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Doomscroll Dodge
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Move left and right. Catch useful signals. Avoid bot traffic,
            ragebait, fake gurus, and premium brainrot.
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <Stat label="Score" value={score} />
          <Stat label="Brainrot" value={`${brainrot}%`} />
          <Stat label="Status" value={status} />
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="relative grid h-[420px] grid-cols-3 overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-b from-stone-50 to-white">
            {[0, 1, 2].map((column) => (
              <button
                key={column}
                type="button"
                onClick={() => setLane(column)}
                className="relative border-r border-stone-100 last:border-r-0"
                aria-label={`Move to lane ${column + 1}`}
              >
                {items
                  .filter((item) => item.lane === column)
                  .map((item) => (
                    <span
                      key={item.id}
                      className={`absolute left-2 right-2 rounded-2xl px-2 py-3 text-center text-xs font-black shadow-sm transition ${
                        item.type === "signal"
                          ? "bg-emerald-100 text-emerald-950"
                          : "bg-red-100 text-red-950"
                      }`}
                      style={{ top: `${item.row * 17}%` }}
                    >
                      {item.label}
                    </span>
                  ))}
                {lane === column ? (
                  <span className="absolute bottom-4 left-1/2 w-20 -translate-x-1/2 rounded-2xl bg-ink px-3 py-4 text-center text-xs font-black text-white shadow-lg">
                    YOU
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            {message}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLane((current) => Math.max(0, current - 1))}
              className="flex-1 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-ink"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => setLane((current) => Math.min(2, current + 1))}
              className="flex-1 rounded-full bg-stone-100 px-5 py-3 text-sm font-bold text-ink"
            >
              Right
            </button>
            {!isRunning ? (
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
              >
                Restart feed
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <GameLinks />
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

function GameLinks() {
  return (
    <section className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
      <p className="text-sm font-semibold text-stone-600">
        Survived the feed? Touch grass by reading an actual briefing.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
        >
          Latest briefings
        </Link>
        <Link
          href="/meme-market"
          className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-ink"
        >
          Meme Market
        </Link>
      </div>
    </section>
  );
}
