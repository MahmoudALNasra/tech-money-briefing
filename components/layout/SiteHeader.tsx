import Link from "next/link";

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
  const navCategories = categories.length > 0 ? categories : CORE_CATEGORIES;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-4 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-ink">
            {siteConfig.name}
          </Link>
          {navCategories.length > 0 ? (
            <nav
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:gap-4 md:overflow-visible md:px-0 md:pb-0"
              aria-label="Categories"
            >
              {navCategories.map((category) => (
                <Link
                  key={category}
                  href={`/${category}`}
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold transition ${
                    category === activeCategory
                      ? "bg-ink text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-ink md:bg-transparent md:px-0"
                  }`}
                >
                  {formatCategory(category)}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      <div aria-hidden="true" className="h-28 md:h-16" />
    </>
  );
}
