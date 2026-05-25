import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { CORE_CATEGORIES } from "@/lib/categories";

type ToolPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  secondaryCopy?: string;
  children: ReactNode;
};

export function ToolPageShell({
  eyebrow,
  title,
  description,
  secondaryCopy,
  children
}: ToolPageShellProps) {
  return (
    <>
      <SiteHeader categories={[...CORE_CATEGORIES]} />
      <main className="bg-stone-50 pt-[73px]">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              {description}
            </p>
            {secondaryCopy ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
                {secondaryCopy}
              </p>
            ) : null}
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          {children}
        </section>
      </main>
    </>
  );
}
