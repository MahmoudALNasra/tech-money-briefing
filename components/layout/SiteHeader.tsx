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

export function SiteHeader({
  categories = CORE_CATEGORIES,
  activeCategory
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navCategories = categories.length > 0 ? categories : CORE_CATEGORIES;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex shrink-0 items-center gap-3 text-lg font-black tracking-tight text-ink"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-2xl"
            />
            <span>{siteConfig.name}</span>
          </Link>

          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label="Site sections"
          >
            <Link
              href="/tools"
              className="rounded-full px-3 py-1 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-ink"
            >
              Tools
            </Link>
            <Link
              href="/compare"
              className="rounded-full px-3 py-1 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-ink"
            >
              Compare
            </Link>
          </nav>

          {navCategories.length > 0 ? (
            <>
              <nav
                className="hidden items-center gap-2 lg:flex"
                aria-label="Categories"
              >
                {navCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/${category}`}
                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                      category === activeCategory
                        ? "bg-ink text-white"
                        : "text-stone-600 hover:text-ink"
                    }`}
                  >
                    {formatCategory(category)}
                  </Link>
                ))}
              </nav>

              <div className="hidden md:block">
                <SearchForm compact />
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

                <nav className="mb-2 grid gap-1" aria-label="Mobile site sections">
                  <Link
                    href="/tools"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-100 hover:text-ink"
                  >
                    Tools
                  </Link>
                  <Link
                    href="/compare"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-100 hover:text-ink"
                  >
                    Compare
                  </Link>
                </nav>

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
