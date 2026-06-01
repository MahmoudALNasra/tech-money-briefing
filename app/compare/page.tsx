import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { COMPARISONS } from "@/lib/comparisons";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Software Comparisons for Publishers and Operators",
  description: `Side-by-side comparisons of newsletters, SEO tools, ecommerce platforms, AI apps, and ad stacks from ${siteConfig.name}.`,
  keywords: [
    "software comparisons",
    "newsletter platform comparison",
    "SEO tool comparison",
    "SaaS comparison guides"
  ],
  robots: { index: true, follow: true }
};

export default function CompareHubPage() {
  const featuredComparisons = COMPARISONS.slice(0, 3);
  const remainingComparisons = COMPARISONS.slice(3);

  return (
    <ToolPageShell
      eyebrow="Comparisons"
      title="Software comparisons for publishers and operators"
      description="Decision guides for newsletter platforms, SEO stacks, ecommerce tools, AI apps, and monetization products."
      secondaryCopy="Each comparison includes a decision table, best-for guidance, and links to relevant free tools."
      monetizationContext="compare"
      newsletterSource="compare_hub"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {featuredComparisons.map((comparison, index) => (
          <Link
            key={comparison.slug}
            href={`/compare/${comparison.slug}`}
            className="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-stone-400 hover:shadow-xl"
          >
            <ComparisonThumbnail comparison={comparison} index={index} />
            <div className="p-5">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-stone-500">
                Featured
              </span>
              <h2 className="mt-4 text-xl font-black text-ink">
                {comparison.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {comparison.description}
              </p>
              <span className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-ink">
                Read comparison
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-400">
              More matchups
            </p>
            <h2 className="mt-2 text-2xl font-black text-ink">
              Browse all comparisons
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
            {COMPARISONS.length} guides
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {remainingComparisons.map((comparison, index) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:border-stone-400 hover:shadow-md sm:grid-cols-[220px_1fr]"
            >
              <ComparisonThumbnail
                comparison={comparison}
                index={index + 3}
                compact
              />
              <div className="p-5">
                <h3 className="text-lg font-black text-ink">
                  {comparison.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {comparison.description}
                </p>
                <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-ink">
                  View guide
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ToolPageShell>
  );
}

function ComparisonThumbnail({
  comparison,
  index,
  compact = false
}: {
  comparison: (typeof COMPARISONS)[number];
  index: number;
  compact?: boolean;
}) {
  const gradients = [
    "from-indigo-600 via-sky-500 to-emerald-400",
    "from-amber-500 via-orange-500 to-rose-500",
    "from-violet-600 via-fuchsia-500 to-cyan-500",
    "from-stone-800 via-slate-600 to-blue-500"
  ];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${
        gradients[index % gradients.length]
      } ${compact ? "min-h-52 sm:min-h-full" : "h-56"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.32),transparent_42%)]" />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white">
        <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
          Compare
        </span>
      </div>
      <div
        className={`absolute inset-x-4 top-1/2 grid -translate-y-1/2 items-center ${
          compact
            ? "grid-cols-[minmax(68px,1fr)_52px_minmax(68px,1fr)] gap-2"
            : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3"
        }`}
      >
        <ProductLogoCard name={comparison.productA} compact={compact} />
        <div
          className={`grid place-items-center rounded-full border-4 border-white/40 bg-white font-black text-ink shadow-2xl ring-4 ring-black/10 ${
            compact ? "h-12 w-12 text-sm" : "h-14 w-14 text-base"
          }`}
        >
          VS
        </div>
        <ProductLogoCard name={comparison.productB} compact={compact} />
      </div>
      <div className="absolute inset-x-4 bottom-4 text-center text-[0.65rem] font-black uppercase tracking-[0.22em] text-white/80">
        {comparison.productA} vs {comparison.productB}
      </div>
    </div>
  );
}

const PRODUCT_LOGO_DOMAINS: Record<string, string> = {
  Adobe: "adobe.com",
  "Adobe Express": "adobe.com/express",
  Ahrefs: "ahrefs.com",
  Airtable: "airtable.com",
  AWS: "aws.amazon.com",
  "AWS CloudFront": "aws.amazon.com/cloudfront",
  "AWS Lambda": "aws.amazon.com/lambda",
  Beehiiv: "beehiiv.com",
  BigQuery: "cloud.google.com/bigquery",
  Buffer: "buffer.com",
  Canva: "canva.com",
  ChatGPT: "openai.com",
  Claude: "anthropic.com",
  Clearscope: "clearscope.io",
  Cloudflare: "cloudflare.com",
  "Cloudflare Workers": "workers.cloudflare.com",
  ConvertKit: "kit.com",
  Cursor: "cursor.com",
  DigitalOcean: "digitalocean.com",
  Firebase: "firebase.google.com",
  Frase: "frase.io",
  Ghost: "ghost.org",
  "GitHub Copilot": "github.com/features/copilot",
  "Google Analytics 4": "analytics.google.com",
  "Google Workspace": "workspace.google.com",
  Gumroad: "gumroad.com",
  Hootsuite: "hootsuite.com",
  Hotjar: "hotjar.com",
  Jasper: "jasper.ai",
  Klaviyo: "klaviyo.com",
  Loom: "loom.com",
  Mailchimp: "mailchimp.com",
  Matomo: "matomo.org",
  Mediavine: "mediavine.com",
  "Microsoft Clarity": "clarity.microsoft.com",
  Moz: "moz.com",
  Neon: "neon.tech",
  Netlify: "netlify.com",
  Notion: "notion.so",
  Paddle: "paddle.com",
  Pipedrive: "pipedrive.com",
  PlanetScale: "planetscale.com",
  Plausible: "plausible.io",
  Railway: "railway.app",
  Render: "render.com",
  Riverside: "riverside.fm",
  Semrush: "semrush.com",
  Shopify: "shopify.com",
  Sitebulb: "sitebulb.com",
  Snowflake: "snowflake.com",
  SpyFu: "spyfu.com",
  "Screaming Frog": "screamingfrog.co.uk",
  Stripe: "stripe.com",
  Substack: "substack.com",
  Supabase: "supabase.com",
  Surfer: "surferseo.com",
  Ubersuggest: "neilpatel.com/ubersuggest",
  Vercel: "vercel.com",
  Webflow: "webflow.com",
  WooCommerce: "woocommerce.com",
  WordPress: "wordpress.org",
  Yoast: "yoast.com",
  Zoho: "zoho.com"
};

function logoUrlForProduct(name: string) {
  const domain = PRODUCT_LOGO_DOMAINS[name];

  if (!domain) {
    return null;
  }

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function productInitials(name: string) {
  return name
    .replace(/\b(vs|and|the)\b/gi, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function ProductLogoCard({
  name,
  compact
}: {
  name: string;
  compact?: boolean;
}) {
  const logoUrl = logoUrlForProduct(name);

  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center rounded-[1.35rem] border border-white/35 bg-white/92 text-center shadow-2xl backdrop-blur ${
        compact ? "h-28 px-2 py-3" : "h-32 p-3"
      }`}
    >
      <div
        className={`grid shrink-0 place-items-center rounded-2xl bg-stone-950/5 ${
          compact ? "h-12 w-12" : "h-16 w-16"
        }`}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            width={64}
            height={64}
            className={`${compact ? "h-8 w-8" : "h-10 w-10"} rounded-xl object-contain`}
            unoptimized
          />
        ) : (
          <span className="text-lg font-black text-ink">{productInitials(name)}</span>
        )}
      </div>
      <div className="mt-2 w-full truncate text-xs font-black leading-tight text-ink">
        {name}
      </div>
    </div>
  );
}
