"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { AuthNavLink } from "@/components/auth/AuthNavLink";
import { SearchForm } from "@/components/search/SearchForm";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { formatCategory } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type SiteHeaderProps = {
  categories?: ReturnType<typeof getPublicNavCategories>;
  activeCategory?: string;
};

const primaryLinks = [
  { href: "/business-data-generator", label: "Leads", badge: "New" },
  { href: "/tools", label: "Tools", badge: "Free" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

const topicMeta: Record<
  string,
  { eyebrow: string; accent: string; dot: string }
> = {
  "ai-tools": {
    eyebrow: "Automation",
    accent: "from-emerald-50 to-lime-50 hover:border-emerald-200",
    dot: "bg-emerald-500"
  },
  "digital-marketing": {
    eyebrow: "Growth",
    accent: "from-sky-50 to-cyan-50 hover:border-sky-200",
    dot: "bg-sky-500"
  },
  seo: {
    eyebrow: "Organic",
    accent: "from-indigo-50 to-violet-50 hover:border-indigo-200",
    dot: "bg-indigo-500"
  },
  ecommerce: {
    eyebrow: "Commerce",
    accent: "from-amber-50 to-orange-50 hover:border-amber-200",
    dot: "bg-amber-500"
  },
  startups: {
    eyebrow: "Builders",
    accent: "from-rose-50 to-pink-50 hover:border-rose-200",
    dot: "bg-rose-500"
  },
  fintech: {
    eyebrow: "Money",
    accent: "from-teal-50 to-emerald-50 hover:border-teal-200",
    dot: "bg-teal-500"
  },
  "creator-business": {
    eyebrow: "Audience",
    accent: "from-purple-50 to-fuchsia-50 hover:border-purple-200",
    dot: "bg-purple-500"
  },
  others: {
    eyebrow: "Signals",
    accent: "from-stone-50 to-zinc-50 hover:border-stone-300",
    dot: "bg-stone-500"
  }
};

export function SiteHeader({
  categories = getPublicNavCategories(),
  activeCategory
}: SiteHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [clickedHref, setClickedHref] = useState("");
  const closeTopicsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navCategories = categories.length > 0 ? categories : getPublicNavCategories();

  useEffect(() => {
    return () => {
      if (closeTopicsTimer.current) {
        clearTimeout(closeTopicsTimer.current);
      }
    };
  }, []);

  const openTopics = () => {
    if (closeTopicsTimer.current) {
      clearTimeout(closeTopicsTimer.current);
    }

    setIsTopicsOpen(true);
  };

  const closeTopics = (delay = 160) => {
    if (closeTopicsTimer.current) {
      clearTimeout(closeTopicsTimer.current);
    }

    closeTopicsTimer.current = setTimeout(() => {
      setIsTopicsOpen(false);
    }, delay);
  };

  const closeTopicsNow = () => {
    if (closeTopicsTimer.current) {
      clearTimeout(closeTopicsTimer.current);
    }

    setIsTopicsOpen(false);
  };

  const handleAnimatedNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setClickedHref(href);
    setIsMenuOpen(false);
    closeTopicsNow();

    window.setTimeout(() => {
      router.push(href);
    }, 180);

    window.setTimeout(() => {
      setClickedHref("");
    }, 700);
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-[60] bg-[radial-gradient(circle_at_50%_12%,rgba(16,185,129,0.18),transparent_34%),linear-gradient(to_bottom,rgba(255,255,255,0.3),transparent)] transition duration-500 ${
          clickedHref ? "opacity-100" : "opacity-0"
        }`}
      />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-white/90 shadow-sm shadow-stone-950/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link
            href="/"
            onClick={(event) => handleAnimatedNavigation(event, "/")}
            className={`group flex shrink-0 items-center gap-3 text-base font-black tracking-tight text-ink transition duration-200 sm:text-lg ${
              clickedHref === "/" ? "scale-95 opacity-80" : "hover:scale-[1.02]"
            }`}
          >
            <Image
              src="/logo.svg"
              alt=""
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-2xl shadow-sm transition group-hover:scale-105"
            />
            <span className="max-w-[180px] truncate sm:max-w-none">
              {siteConfig.name}
            </span>
          </Link>

          {navCategories.length > 0 ? (
            <>
              <div className="hidden items-center gap-3 lg:flex">
                <nav
                  className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50/80 p-1 shadow-sm"
                  aria-label="Primary navigation"
                >
                  {primaryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(event) =>
                        handleAnimatedNavigation(event, link.href)
                      }
                      className={`group relative overflow-hidden rounded-full px-3.5 py-2 text-sm font-bold text-stone-600 transition duration-200 before:absolute before:inset-0 before:scale-x-0 before:rounded-full before:bg-white before:transition before:duration-300 hover:-translate-y-0.5 hover:text-ink hover:shadow-sm hover:before:scale-x-100 ${
                        clickedHref === link.href
                          ? "scale-95 bg-ink text-white shadow-inner before:scale-x-0"
                          : ""
                      }`}
                    >
                      <span className="relative z-10">{link.label}</span>
                      {link.badge ? (
                        <span className="relative z-10 ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </nav>

                <div
                  className="relative"
                  onMouseEnter={openTopics}
                  onMouseLeave={() => closeTopics()}
                  onFocus={openTopics}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      closeTopicsNow();
                    }
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isTopicsOpen}
                    aria-haspopup="true"
                    onClick={() => setIsTopicsOpen((current) => !current)}
                    className="group inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-gradient-to-r from-white via-emerald-50 to-sky-50 px-4 py-2 text-sm font-black text-ink shadow-sm shadow-emerald-950/5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-black text-white">
                      #
                    </span>
                    Topics
                    <span
                      className={`text-stone-500 transition ${
                        isTopicsOpen ? "rotate-180" : ""
                      }`}
                    >
                      v
                    </span>
                  </button>
                  <nav
                    className={`absolute right-0 top-full z-50 w-[31rem] origin-top-right pt-3 transition duration-200 ${
                      isTopicsOpen
                        ? "translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none -translate-y-2 scale-95 opacity-0"
                    }`}
                    aria-label="Topics"
                  >
                    <div className="rounded-[2rem] border border-stone-200 bg-white/95 p-3 shadow-2xl shadow-stone-950/15 backdrop-blur-xl">
                      <div className="mb-2 overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-stone-900 to-emerald-900 p-5 text-white">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                          Explore briefs
                        </p>
                        <p className="mt-2 text-lg font-black tracking-tight">
                          Pick a revenue signal, then turn it into action.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {navCategories.map((category) => {
                          const href = `/${category}`;
                          const meta = topicMeta[category] ?? topicMeta.others;

                          return (
                            <Link
                              key={category}
                              href={href}
                              onClick={(event) =>
                                handleAnimatedNavigation(event, href)
                              }
                              className={`group/topic relative overflow-hidden rounded-2xl border p-3 transition duration-200 before:absolute before:inset-0 before:translate-x-[-120%] before:bg-gradient-to-r before:from-white/0 before:via-white/60 before:to-white/0 before:transition before:duration-500 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-lg hover:shadow-stone-950/10 hover:before:translate-x-[120%] ${
                                clickedHref === href
                                  ? "scale-95 ring-4 ring-emerald-200"
                                  : ""
                              } ${
                                category === activeCategory
                                  ? "border-ink bg-ink text-white shadow-md"
                                  : `border-stone-100 bg-gradient-to-br ${meta.accent} text-stone-800`
                              }`}
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full transition group-hover/topic:scale-150 ${
                                    category === activeCategory
                                      ? "bg-lime-300"
                                      : meta.dot
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-black uppercase tracking-[0.18em] ${
                                    category === activeCategory
                                      ? "text-stone-300"
                                      : "text-stone-500"
                                  }`}
                                >
                                  {meta.eyebrow}
                                </span>
                              </span>
                              <span className="relative z-10 mt-2 block text-sm font-black transition group-hover/topic:translate-x-1">
                                {formatCategory(category)}
                              </span>
                              <span
                                className={`relative z-10 mt-1 block text-xs leading-5 ${
                                  category === activeCategory
                                    ? "text-stone-300"
                                    : "text-stone-500"
                                }`}
                              >
                                Latest tools, trends, and operator notes.
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </nav>
                </div>
              </div>

              <div className="ml-auto hidden md:block">
                <SearchForm compact />
              </div>

              <div className="hidden md:block">
                <AuthNavLink />
              </div>

              <div className="hidden items-center gap-2 md:flex lg:hidden">
                <Link
                  href="/tools"
                  onClick={(event) => handleAnimatedNavigation(event, "/tools")}
                  className={`rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-stone-700 ${
                    clickedHref === "/tools" ? "scale-95 ring-4 ring-emerald-200" : ""
                  }`}
                >
                  Tools
                </Link>
                <Link
                  href="/compare"
                  onClick={(event) =>
                    handleAnimatedNavigation(event, "/compare")
                  }
                  className={`rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:border-ink hover:text-ink ${
                    clickedHref === "/compare"
                      ? "scale-95 ring-4 ring-emerald-200"
                      : ""
                  }`}
                >
                  Compare
                </Link>
              </div>

              <button
                type="button"
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((current) => !current)}
                className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-stone-50 transition hover:border-ink hover:bg-white lg:hidden"
              >
                <span className="relative h-4 w-5">
                  <span
                    className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-ink transition duration-300 ${
                      isMenuOpen ? "translate-y-[7px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-ink transition duration-300 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-ink transition duration-300 ${
                      isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>

              <div
                className={`absolute inset-x-3 top-[calc(100%+0.5rem)] origin-top rounded-3xl border border-stone-200 bg-white p-3 shadow-2xl shadow-stone-950/10 transition duration-300 lg:hidden ${
                  isMenuOpen
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-3 scale-95 opacity-0"
                }`}
              >
                <div className="mb-3 rounded-2xl bg-stone-50 p-3">
                  <SearchForm onSearch={() => setIsMenuOpen(false)} />
                </div>

                <nav className="grid gap-2" aria-label="Mobile site sections">
                  {primaryLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(event) =>
                        handleAnimatedNavigation(event, link.href)
                      }
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-stone-800 transition hover:-translate-y-0.5 hover:bg-stone-100 hover:text-ink ${
                        clickedHref === link.href
                          ? "scale-95 bg-emerald-50 ring-4 ring-emerald-100"
                          : ""
                      }`}
                    >
                      {link.label}
                      {link.badge ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-800">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                  <AuthNavLink />
                </nav>

                <div className="my-3 h-px bg-stone-100" />
                <p className="px-4 pb-2 text-xs font-black uppercase tracking-[0.22em] text-stone-400">
                  Topics
                </p>
                <nav className="grid gap-1" aria-label="Mobile categories">
                  {navCategories.map((category) => (
                    <Link
                      key={category}
                      href={`/${category}`}
                      onClick={(event) =>
                        handleAnimatedNavigation(event, `/${category}`)
                      }
                      className={`rounded-2xl px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                        clickedHref === `/${category}`
                          ? "scale-95 ring-4 ring-emerald-100"
                          : ""
                      } ${
                        category === activeCategory
                          ? "bg-ink text-white"
                          : "text-stone-700 hover:bg-stone-100 hover:text-ink"
                      }`}
                    >
                      {formatCategory(category)}
                    </Link>
                  ))}
                </nav>
              </div>
            </>
          ) : null}
        </div>
      </header>
      <div aria-hidden="true" className="h-20" />
    </>
  );
}
