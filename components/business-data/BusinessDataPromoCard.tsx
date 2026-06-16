import Image from "next/image";
import Link from "next/link";

type BusinessDataPromoCardProps = {
  compact?: boolean;
  source?: string;
  title?: string;
  copy?: string;
};

export function BusinessDataPromoCard({
  compact = false,
  source = "internal_cta",
  title = "Need real competitor data, not just a free tool?",
  copy = "Use the business data generator to find local competitors, map nearby businesses, and export polished Excel reports with website signals and outreach notes."
}: BusinessDataPromoCardProps) {
  const href = `/leads?source=${encodeURIComponent(source)}`;

  return (
    <aside
      className={`overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-stone-50 shadow-sm ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <div className="flex gap-4">
        <div className="relative hidden h-20 w-20 shrink-0 sm:block">
          <Image
            src="/assistant-mascot-body.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Local business report
          </p>
          <h2 className={`${compact ? "mt-2 text-lg" : "mt-3 text-2xl"} font-black text-ink`}>
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-950">{copy}</p>
          <Link
            href={href}
            className="mt-4 inline-flex rounded-full bg-stone-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
          >
            Open business data generator
          </Link>
        </div>
      </div>
    </aside>
  );
}
