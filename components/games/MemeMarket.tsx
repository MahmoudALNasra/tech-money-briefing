"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Meme = {
  name: string;
  volatility: number;
  lifespan: number;
};

const memes: Meme[] = [
  { name: "AI hamster CEO", volatility: 11, lifespan: 78 },
  { name: "NPC side hustle guru", volatility: 15, lifespan: 62 },
  { name: "low CPM goblin", volatility: 9, lifespan: 95 },
  { name: "faceless automation bro", volatility: 13, lifespan: 70 },
  { name: "viral cat accountant", volatility: 7, lifespan: 105 }
];

function pickMeme() {
  return memes[Math.floor(Math.random() * memes.length)];
}

export function MemeMarket() {
  const [cash, setCash] = useState(100);
  const [meme, setMeme] = useState<Meme>(() => pickMeme());
  const [heat, setHeat] = useState(22);
  const [holdings, setHoldings] = useState(0);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState("Buy the meme before it peaks. Sell before it becomes cringe.");

  const price = useMemo(() => {
    const peak = Math.sin((heat / meme.lifespan) * Math.PI);
    const hype = Math.max(0.15, peak);
    return Math.max(1, Math.round(8 + hype * meme.volatility * 9));
  }, [heat, meme]);

  const portfolio = cash + holdings * price;
  const isDead = heat >= meme.lifespan;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeat((current) => current + 2.8);
    }, 550);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isDead) {
      return;
    }

    const deathTimeout = window.setTimeout(() => {
      if (holdings > 0) {
        setMessage("The meme died while you were holding. Brutal.");
        setHoldings(0);
      } else {
        setMessage("The meme died. New brainrot loading.");
      }
    }, 0);
    const nextRoundTimeout = window.setTimeout(() => {
      setMeme(pickMeme());
      setHeat(12);
      setRound((current) => current + 1);
    }, 900);

    return () => {
      window.clearTimeout(deathTimeout);
      window.clearTimeout(nextRoundTimeout);
    };
  }, [isDead, holdings]);

  function buy() {
    if (cash < price || isDead) {
      setMessage("Insufficient liquidity. Try selling a course.");
      return;
    }

    setCash((current) => current - price);
    setHoldings((current) => current + 1);
    setMessage(`Bought 1 ${meme.name}. This is financial comedy.`);
  }

  function sell() {
    if (holdings <= 0) {
      setMessage("You cannot sell vibes you do not own.");
      return;
    }

    setCash((current) => current + price);
    setHoldings((current) => current - 1);
    setMessage(`Sold at $${price}. Screenshot the fake gains.`);
  }

  function reset() {
    setCash(100);
    setHoldings(0);
    setHeat(22);
    setRound(1);
    setMeme(pickMeme());
    setMessage("Buy the meme before it peaks. Sell before it becomes cringe.");
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-ink p-5 text-white sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
            Brainrot Trading Floor
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Meme Market
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Buy low, sell before the meme becomes uncool. Every round is a new
            internet asset nobody should own.
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-4 sm:p-6">
          <Stat label="Cash" value={`$${cash}`} />
          <Stat label="Price" value={`$${price}`} />
          <Stat label="Holding" value={holdings} />
          <Stat label="Portfolio" value={`$${portfolio}`} />
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-[2rem] border border-stone-200 bg-gradient-to-br from-fuchsia-50 via-white to-cyan-50 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
              Round {round}
            </p>
            <h3 className="mt-3 text-3xl font-black text-ink">{meme.name}</h3>
            <p className="mt-2 text-sm font-semibold text-stone-500">
              Current hype: {Math.min(100, Math.round((heat / meme.lifespan) * 100))}%
            </p>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-white shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all"
                style={{
                  width: `${Math.min(100, (heat / meme.lifespan) * 100)}%`
                }}
              />
            </div>
            <p className="mt-5 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-stone-700">
              {message}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={buy}
              className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              Buy meme
            </button>
            <button
              type="button"
              onClick={sell}
              className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white hover:bg-stone-700"
            >
              Sell meme
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-black text-ink hover:border-ink"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
        <p className="text-sm font-semibold text-stone-600">
          When the meme is dead, read something with actual signal.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white"
          >
            Latest briefings
          </Link>
          <Link
            href="/doomscroll-dodge"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-ink"
          >
            Doomscroll Dodge
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
