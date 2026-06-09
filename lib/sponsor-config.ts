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
    title: "Your ad here",
    description:
      "Place your offer in front of operators, founders, and technical buyers reading high-intent industry analysis.",
    cta: "Advertise with us"
  },
  article: {
    title: "Your ad here",
    description:
      "Sponsor this briefing with a relevant product, service, or operator-focused offer.",
    cta: "Advertise here"
  },
  tool: {
    title: "Your ad here",
    description:
      "Reach visitors while they use calculators, SEO tools, and workflow utilities.",
    cta: "Sponsor a tool page"
  },
  compare: {
    title: "Your ad here",
    description:
      "Place your brand on comparison pages where buyers are actively evaluating tools.",
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
