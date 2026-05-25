"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NewsletterCapture } from "@/components/newsletter/NewsletterCapture";

type Upgrade = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  revenuePerSecond: number;
  owned: number;
};

const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: "ai-tools",
    name: "AI Tool Stack",
    description: "Automate busywork. Margin goes up.",
    baseCost: 15,
    revenuePerSecond: 0.5,
    owned: 0
  },
  {
    id: "seo",
    name: "SEO Content Engine",
    description: "Organic traffic starts compounding.",
    baseCost: 80,
    revenuePerSecond: 2,
    owned: 0
  },
  {
    id: "newsletter",
    name: "Email Newsletter",
    description: "Owned audience = owned revenue.",
    baseCost: 350,
    revenuePerSecond: 8,
    owned: 0
  },
  {
    id: "ecommerce",
    name: "Ecommerce Store",
    description: "Products ship. Cart value climbs.",
    baseCost: 1200,
    revenuePerSecond: 25,
    owned: 0
  },
  {
    id: "fintech",
    name: "Fintech Layer",
    description: "Payments + subscriptions unlocked.",
    baseCost: 5000,
    revenuePerSecond: 90,
    owned: 0
  },
  {
    id: "ads",
    name: "Paid Growth Loop",
    description: "CAC is high. LTV is higher.",
    baseCost: 25000,
    revenuePerSecond: 400,
    owned: 0
  }
];

const MILESTONES: { amount: number; message: string }[] = [
  { amount: 100, message: "First $100. You are officially a founder." },
  { amount: 1_000, message: "$1K MRR vibes. Investors slide into DMs." },
  { amount: 10_000, message: "$10K. Time to tweet “we’re profitable.”" },
  { amount: 100_000, message: "$100K. Your newsletter is the product now." },
  { amount: 1_000_000, message: "$1M. Tech Revenue Brief writes about you." }
];

function formatRevenue(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${Math.floor(value).toLocaleString()}`;
}

function upgradeCost(upgrade: Upgrade) {
  return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
}

export function RevenueClicker() {
  const [revenue, setRevenue] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [upgrades, setUpgrades] = useState(INITIAL_UPGRADES);
  const [toast, setToast] = useState<string | null>(null);
  const [clickBurst, setClickBurst] = useState(false);
  const seenMilestonesRef = useRef(new Set<number>());

  const revenuePerSecond = useMemo(
    () => upgrades.reduce((sum, u) => sum + u.owned * u.revenuePerSecond, 0),
    [upgrades]
  );

  const clickPower = useMemo(
    () => 1 + Math.floor(clicks / 25) + revenuePerSecond * 0.1,
    [clicks, revenuePerSecond]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const checkMilestones = useCallback(
    (total: number) => {
      for (const milestone of MILESTONES) {
        if (
          total >= milestone.amount &&
          !seenMilestonesRef.current.has(milestone.amount)
        ) {
          seenMilestonesRef.current.add(milestone.amount);
          showToast(milestone.message);
          break;
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (revenuePerSecond <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setRevenue((current) => {
        const next = current + revenuePerSecond / 10;
        checkMilestones(next);
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [revenuePerSecond, checkMilestones]);

  function handleClick() {
    setRevenue((current) => {
      const next = current + clickPower;
      checkMilestones(next);
      return next;
    });
    setClicks((current) => current + 1);
    setClickBurst(true);
    window.setTimeout(() => setClickBurst(false), 120);
  }

  function buyUpgrade(id: string) {
    const upgrade = upgrades.find((item) => item.id === id);

    if (!upgrade) {
      return;
    }

    const cost = upgradeCost(upgrade);

    if (revenue < cost) {
      return;
    }

    setRevenue((current) => current - cost);
    setUpgrades((current) =>
      current.map((item) =>
        item.id === id ? { ...item, owned: item.owned + 1 } : item
      )
    );
    showToast(`Unlocked: ${upgrade.name}`);
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-ink via-stone-900 to-stone-800 p-6 text-white shadow-lg sm:p-8">
        {toast ? (
          <div className="absolute inset-x-4 top-4 z-10 rounded-2xl bg-white/95 px-4 py-3 text-sm font-bold text-ink shadow-lg">
            {toast}
          </div>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
          Hidden Founder Mode
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          Revenue Clicker
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">
          Click to earn. Buy upgrades. Build the most unrealistic internet
          business empire on the planet.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-stone-300">
              Total revenue
            </p>
            <p className="mt-1 text-2xl font-black">{formatRevenue(revenue)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-stone-300">
              Per second
            </p>
            <p className="mt-1 text-2xl font-black">
              {formatRevenue(revenuePerSecond)}/s
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-stone-300">
              Per click
            </p>
            <p className="mt-1 text-2xl font-black">
              +{formatRevenue(clickPower)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className={`mt-8 w-full rounded-3xl bg-white px-6 py-8 text-xl font-black text-ink transition active:scale-[0.98] sm:text-2xl ${
            clickBurst ? "scale-[1.02] shadow-2xl" : "shadow-lg hover:bg-stone-100"
          }`}
        >
          Generate Revenue
        </button>
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-black text-ink">Upgrade your stack</h3>
        <p className="mt-2 text-sm text-stone-600">
          Each purchase adds passive revenue. Costs scale — just like real SaaS.
        </p>
        <ul className="mt-6 space-y-3">
          {upgrades.map((upgrade) => {
            const cost = upgradeCost(upgrade);
            const canAfford = revenue >= cost;

            return (
              <li
                key={upgrade.id}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-ink">
                    {upgrade.name}{" "}
                    <span className="text-stone-500">×{upgrade.owned}</span>
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {upgrade.description}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-stone-500">
                    +{formatRevenue(upgrade.revenuePerSecond)}/s each
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => buyUpgrade(upgrade.id)}
                  disabled={!canAfford}
                  className="shrink-0 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  Buy {formatRevenue(cost)}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
        <p className="text-sm font-semibold text-stone-600">
          Done clicking? Read real briefings.
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
            href="/creator-business"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:border-ink"
          >
            Creator Business
          </Link>
        </div>
      </section>

      <NewsletterCapture
        placementIndex={99}
        source="revenue_clicker"
        variant="compact"
      />
    </div>
  );
}
