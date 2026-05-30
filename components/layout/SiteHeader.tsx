"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SearchForm } from "@/components/search/SearchForm";
import { CORE_CATEGORIES } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type SiteHeaderProps = {
  categories?: readonly string[];
  activeCategory?: string;
};

const primaryLinks = [
  { href: "/tools", label: "Tools", badge: "Free" },
  { href: "/compare", label: "Compare" },
  { href: "/monetization-audit", label: "Audit" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader({
  categories = CORE_CATEGORIES,
  activeCategory
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navCategories = categories.length > 0 ? categories : CORE_CATEGORIES;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-white/90 shadow-sm shadow-stone-950/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="group flex shrink-0 items-center gap-3 text-base font-black tracking-tight text-ink sm:text-lg"
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
                      className="group relative rounded-full px-3.5 py-2 text-sm font-bold text-stone-600 transition hover:bg-white hover:text-ink hover:shadow-sm"
                    >
                      {link.label}
                      {link.badge ? (
                        <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </nav>

                <details className="group relative">
                  <summary className="list-none rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm transition hover:border-stone-300 hover:text-ink [&::-webkit-details-marker]:hidden">
                    Topics
                    <span className="ml-2 inline-block transition group-open:rotate-180">
                      v
                    </span>
                  </summary>
                  <nav
                    className="absolute right-0 top-[calc(100%+0.75rem)] z-50 grid w-72 gap-1 rounded-3xl border border-stone-200 bg-white p-3 shadow-2xl shadow-stone-950/10"
                    aria-label="Topics"
                  >
                    {navCategories.map((category) => (
                      <Link
                        key={category}
                        href={`/${category}`}
                        className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                          category === activeCategory
                            ? "bg-ink text-white"
                            : "text-stone-700 hover:bg-stone-100 hover:text-ink"
                        }`}
                      >
                        {formatCategory(category)}
                      </Link>
                    ))}
                  </nav>
                </details>
              </div>

              <div className="ml-auto hidden md:block">
                <SearchForm compact />
              </div>

              <div className="hidden items-center gap-2 md:flex lg:hidden">
                <Link
                  href="/tools"
                  className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-stone-700"
                >
                  Tools
                </Link>
                <Link
                  href="/compare"
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:border-ink hover:text-ink"
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
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-stone-800 transition hover:bg-stone-100 hover:text-ink"
                    >
                      {link.label}
                      {link.badge ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-800">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
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
                      onClick={() => setIsMenuOpen(false)}
                      className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
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
