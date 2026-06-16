import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { BusinessDataPromoCard } from "@/components/business-data/BusinessDataPromoCard";
import { MonetizationRail } from "@/components/monetization/MonetizationRail";
import { ToolAssistant } from "@/components/tools/ToolAssistant";
import { ToolPageNav } from "@/components/tools/ToolPageNav";
import { ToolRelatedTools } from "@/components/tools/ToolRelatedTools";
import { ToolHumanLayer } from "@/components/tools/ToolHumanLayer";
import { ToolSeoSections } from "@/components/tools/ToolSeoSections";
import BlurText from "@/components/ui/BlurText";
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
  animateHeroTitle?: boolean;
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
  animateHeroTitle = false,
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
      <main className="min-h-screen bg-[var(--bg-base)]">
        <section className="page-hero-band">
          <div
            className={`page-hero-inner ${heroMaxWidthClassName}`}
          >
            <p className="page-eyebrow">
              {eyebrow}
            </p>
            <h1 className="page-h1">
              {animateHeroTitle ? (
                <BlurText
                  text={title}
                  delay={60}
                  animateBy="words"
                  direction="top"
                  threshold={0.3}
                  className="blur-headline-word"
                />
              ) : (
                title
              )}
            </h1>
            <p className="page-sub">
              {description}
            </p>
            {secondaryCopy ? (
              <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
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
          {toolHref && toolHref !== "/leads" && toolHref !== "/business-data-generator" ? (
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
