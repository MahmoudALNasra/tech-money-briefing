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
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-lg font-black tracking-tight text-ink">
          {siteConfig.name}
        </Link>
        {navCategories.length > 0 ? (
          <nav className="flex flex-wrap gap-2 md:gap-4" aria-label="Categories">
            {navCategories.map((category) => (
              <Link
                key={category}
                href={`/${category}`}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
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
  );
}
