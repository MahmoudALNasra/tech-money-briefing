import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { BusinessDataPromoCard } from "@/components/business-data/BusinessDataPromoCard";
import { MonetizationRail } from "@/components/monetization/MonetizationRail";
import { ToolAssistant } from "@/components/tools/ToolAssistant";
import { ToolPageNav } from "@/components/tools/ToolPageNav";
import { ToolRelatedTools } from "@/components/tools/ToolRelatedTools";
import { ToolHumanLayer } from "@/components/tools/ToolHumanLayer";
import { ToolSeoSections } from "@/components/tools/ToolSeoSections";
import { CORE_CATEGORIES } from "@/lib/categories";
import { faqJsonLdFromItems, webApplicationJsonLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import type { SponsorPlacementContext } from "@/lib/sponsor-config";
import { getToolPageSeo } from "@/lib/tool-pages";

type ToolPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  secondaryCopy?: string;
  toolHref?: string;
  showMonetizationRail?: boolean;
  showAssistant?: boolean;
  monetizationContext?: SponsorPlacementContext;
  newsletterSource?: string;
  contentMaxWidthClassName?: string;
  heroMaxWidthClassName?: string;
  children: ReactNode;
};

export function ToolPageShell({
  eyebrow,
  title,
  description,
  secondaryCopy,
  toolHref,
  showMonetizationRail = true,
  showAssistant = true,
  monetizationContext = "tool",
  newsletterSource = "tool_page",
  contentMaxWidthClassName = "max-w-5xl",
  heroMaxWidthClassName = "max-w-5xl",
  children
}: ToolPageShellProps) {
  const seo = toolHref ? getToolPageSeo(toolHref) : undefined;
  const faqLd = seo?.faqs.length ? faqJsonLdFromItems(seo.faqs) : null;
  const appLd = toolHref
    ? webApplicationJsonLd({
        name: title,
        description,
        url: absoluteUrl(toolHref)
      })
    : null;

  return (
    <>
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
      {appLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
        />
      ) : null}
      <SiteHeader categories={[...CORE_CATEGORIES]} />
      <main className="bg-stone-50 pt-[73px]">
        <section className="relative overflow-hidden border-b border-stone-200 bg-white">
          <div
            className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200/60 to-sky-200/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className={`relative mx-auto ${heroMaxWidthClassName} px-5 py-10 sm:px-8 sm:py-14`}
          >
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
        <section className={`mx-auto ${contentMaxWidthClassName} px-5 py-10 sm:px-8`}>
          {toolHref ? <ToolPageNav toolHref={toolHref} /> : null}
          {toolHref ? (
            <ToolHumanLayer
              toolHref={toolHref}
              toolTitle={title}
              variant="before"
            />
          ) : null}
          {children}
          {toolHref && toolHref !== "/business-data-generator" ? (
            <div className="mt-8">
              <BusinessDataPromoCard source={`tool_${toolHref.replace(/^\//, "")}`} />
            </div>
          ) : null}
          {toolHref ? (
            <>
              <ToolHumanLayer
                toolHref={toolHref}
                toolTitle={title}
                variant="after"
              />
              <ToolRelatedTools currentHref={toolHref} />
              <ToolSeoSections toolHref={toolHref} />
            </>
          ) : null}
          {showMonetizationRail ? (
            <MonetizationRail
              context={monetizationContext}
              placementIndex={42}
              newsletterSource={newsletterSource}
              newsletterTitle="Weekly AI, SEO, and revenue tools in your inbox."
              newsletterDescription="Short signals on tools, monetization tests, and publishable assets—built for founders and operators."
            />
          ) : null}
        </section>
      </main>
      {showAssistant && toolHref ? (
        <ToolAssistant toolHref={toolHref} toolTitle={title} />
      ) : null}
    </>
  );
}
