export type SponsorPlacementContext = "article" | "tool" | "compare" | "feed";

export type SponsorPlacement = {
  mode: "paid" | "house";
  badge: string;
  title: string;
  description: string;
  cta: string;
  url: string;
};

const houseDefaults: Record<
  SponsorPlacementContext,
  { title: string; description: string; cta: string }
> = {
  feed: {
    title: "Promote your product to AI decision makers",
    description:
      "Reach operators, founders, and technical buyers reading high-intent industry analysis.",
    cta: "Sponsor this briefing"
  },
  article: {
    title: "Reach readers while they are evaluating revenue moves",
    description:
      "Native partner placements on high-intent articles for SaaS, AI tools, hosting, and growth software.",
    cta: "Request article placement"
  },
  tool: {
    title: "Put your product in front of operators using free tools",
    description:
      "Sponsor cards on calculators and SEO utilities where founders plan spend and workflows.",
    cta: "Sponsor a tool page"
  },
  compare: {
    title: "Show up when buyers are choosing between stacks",
    description:
      "Category-aligned placements on software comparison guides for publishers and operators.",
    cta: "Sponsor a comparison"
  }
};

function paidSponsorEnabled() {
  return (
    process.env.NEXT_PUBLIC_SPONSOR_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_SPONSOR_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SPONSOR_TITLE?.trim())
  );
}

export function getSponsorPlacement(
  context: SponsorPlacementContext
): SponsorPlacement {
  if (paidSponsorEnabled()) {
    return {
      mode: "paid",
      badge: process.env.NEXT_PUBLIC_SPONSOR_BADGE?.trim() || "Sponsored",
      title: process.env.NEXT_PUBLIC_SPONSOR_TITLE!.trim(),
      description:
        process.env.NEXT_PUBLIC_SPONSOR_DESCRIPTION?.trim() ||
        "Partner placement on Tech Revenue Brief.",
      cta: process.env.NEXT_PUBLIC_SPONSOR_CTA?.trim() || "Learn more",
      url: process.env.NEXT_PUBLIC_SPONSOR_URL!.trim()
    };
  }

  const contextCopy = houseDefaults[context];

  return {
    mode: "house",
    badge: process.env.NEXT_PUBLIC_PROMO_BADGE?.trim() || "Partner Slot",
    title: process.env.NEXT_PUBLIC_PROMO_TITLE?.trim() || contextCopy.title,
    description:
      process.env.NEXT_PUBLIC_PROMO_DESCRIPTION?.trim() ||
      contextCopy.description,
    cta: process.env.NEXT_PUBLIC_PROMO_CTA?.trim() || contextCopy.cta,
    url:
      process.env.NEXT_PUBLIC_PROMO_URL?.trim() ||
      "mailto:ads@techrevenuebrief.com"
  };
}
