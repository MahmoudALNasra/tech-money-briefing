import type { ReactNode } from "react";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  children
}: InfoPageProps) {
  return (
    <main className="bg-stone-50">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            {description}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <div className="prose prose-stone max-w-none rounded-2xl border border-stone-200 bg-white p-6 prose-headings:text-ink prose-a:text-ink sm:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
