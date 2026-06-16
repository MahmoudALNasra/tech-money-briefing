"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Signal = {
  cat: string;
  cls: string;
  text: string;
};

type TerminalArticle = {
  title?: string;
  headline?: string;
  meta_description?: string;
  category?: string;
};

const fallbackSignals: Signal[] = [
  { cat: "AI Tools", cls: "b-ai", text: "<strong>Anthropic paused India access</strong> — teams using Claude in client workflows need a fallback model configured now." },
  { cat: "SEO", cls: "b-seo", text: "<strong>Shopify collection pages leaking rank</strong> — thin category copy is the fastest fix before adding more blog content." },
  { cat: "Leads", cls: "b-leads", text: "<strong>3,847 businesses found</strong> in 5km radius · San Antonio TX — restaurants, med spas, auto shops. Emails available for Pro." },
  { cat: "Fintech", cls: "b-fintech", text: "<strong>AI IPO window is open</strong> — gross margin and customer concentration matter more than the deck narrative right now." },
  { cat: "Startups", cls: "b-startups", text: "<strong>SaaS pricing page mistakes</strong> — 3 plans is enough. If visitors can't identify their plan in 5 seconds, it's too complex." },
  { cat: "Ecommerce", cls: "b-ecom", text: "<strong>WooCommerce vs Shopify SEO</strong> — pick the platform your team will actually maintain, not the longer feature list." },
  { cat: "AI Tools", cls: "b-ai", text: "<strong>Meta cancelled $2B Manus deal</strong> — founders betting on platform partnerships need a second distribution channel." },
  { cat: "SEO", cls: "b-seo", text: "<strong>Content gap analysis tool</strong> — missing FAQ sections and unlinked subtopics are the easiest ranking wins this quarter." },
  { cat: "Leads", cls: "b-leads", text: "<strong>Competitor report ready</strong> — 142 businesses in your radius with no active ads and missing Google reviews." },
  { cat: "Startups", cls: "b-startups", text: "<strong>AI startup naming workflow</strong> — use AI for raw options, then filter hard with domain availability and real-world checks." }
];

function categorySignalClass(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("ai")) return "badge-ai";
  if (normalized.includes("seo")) return "badge-seo";
  if (normalized.includes("fintech")) return "badge-fintech";
  if (normalized.includes("startup")) return "badge-startups";
  if (normalized.includes("ecommerce")) return "badge-ecommerce";
  if (normalized.includes("marketing")) return "badge-digital";
  if (normalized.includes("creator")) return "badge-creator";
  if (normalized.includes("lead")) return "badge-leads";

  return "badge-ai";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSignalsFromArticles() {
  const articles = window.__TRB_ARTICLES__ || [];

  if (articles.length > 0) {
    return articles.slice(0, 8).map((article: TerminalArticle) => {
      const title = article.title || article.headline || "Latest briefing";
      const description = article.meta_description || "New operator signal is ready.";
      const category = article.category || "AI Tools";

      return {
        cat: category,
        cls: categorySignalClass(category),
        text: `<strong>${escapeHtml(title)}</strong> — ${escapeHtml(description)}`
      };
    });
  }

  const cards = Array.from(document.querySelectorAll<HTMLElement>("#articles .article-card"));

  if (cards.length > 0) {
    return cards.slice(0, 6).map((card) => {
      const title = card.querySelector<HTMLElement>(".card-title, h2")?.textContent || "Latest briefing";
      const description =
        card.querySelector<HTMLElement>(".card-excerpt")?.textContent ||
        "New operator signal is ready.";
      const category =
        card.querySelector<HTMLElement>(".badge, .signal-badge")?.textContent || "AI Tools";

      return {
        cat: category,
        cls: categorySignalClass(category),
        text: `<strong>${escapeHtml(title)}</strong> — ${escapeHtml(description)}`
      };
    });
  }

  return fallbackSignals;
}

function nextSignal(pool: Signal[], current: Signal[], cursor: number) {
  const visibleText = new Set(current.map((item) => item.text));

  for (let offset = 0; offset < pool.length; offset += 1) {
    const signal = pool[(cursor + offset) % pool.length];
    if (!visibleText.has(signal.text)) {
      return { signal, nextCursor: (cursor + offset + 1) % pool.length };
    }
  }

  return { signal: pool[cursor % pool.length], nextCursor: (cursor + 1) % pool.length };
}

export default function TerminalFeed() {
  const [items, setItems] = useState(() => fallbackSignals.slice(0, 4));
  const signalPoolRef = useRef<Signal[]>(fallbackSignals);
  const cursorRef = useRef(4);
  const [cycle, setCycle] = useState(0);
  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    const refreshFromArticles = () => {
      const nextPool = getSignalsFromArticles();
      signalPoolRef.current = nextPool;
      setItems(nextPool.slice(0, 4));
      cursorRef.current = 4;
      setCycle((value) => value + 1);
    };

    refreshFromArticles();

    const injectSignal = (category?: string) => {
      window.requestAnimationFrame(() => {
        setItems((current) => {
          const pool = signalPoolRef.current;
          const matching = category
            ? pool.find((signal) => signal.cat === category)
            : null;
          const result = matching
            ? { signal: matching, nextCursor: (pool.indexOf(matching) + 1) % pool.length }
            : nextSignal(pool, current, cursorRef.current);
          const next = result.signal;
          cursorRef.current = result.nextCursor;
          return [...current.slice(-3), next];
        });
        setCycle((value) => value + 1);
      });
    };

    const onCategorySignal = (event: Event) => {
      const detail = (event as CustomEvent<{ category?: string }>).detail;
      injectSignal(detail?.category);
    };

    window.addEventListener("trb:terminal-signal", onCategorySignal);

    if (document.readyState !== "complete") {
      window.addEventListener("load", refreshFromArticles, { once: true });
    }

    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener("trb:terminal-signal", onCategorySignal);
        window.removeEventListener("load", refreshFromArticles);
      };
    }

    const interval = window.setInterval(() => injectSignal(), 2600);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("trb:terminal-signal", onCategorySignal);
      window.removeEventListener("load", refreshFromArticles);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="terminal-card" aria-label="Live signal feed preview">
      <div className="terminal-bar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">signal-feed.sh — live briefings</span>
        <span className="terminal-live"><span />live</span>
      </div>
      <div className="terminal-body">
        <p className="terminal-command"><span>$</span> trb --feed --category=all --limit=4</p>
        <div className="terminal-items" key={cycle}>
          {items.map((item, index) => (
            <div className="terminal-item" key={`${item.text}-${index}`}>
              <span className={`badge signal-badge ${item.cls}`}>{item.cat}</span>
              <span dangerouslySetInnerHTML={{ __html: item.text }} />
            </div>
          ))}
        </div>
        <p className="terminal-fetching">fetching next signal <span className="terminal-cursor" /></p>
      </div>
    </div>
  );
}

