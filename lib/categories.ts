export const CORE_CATEGORIES = [
  "ai-tools",
  "digital-marketing",
  "seo",
  "ecommerce",
  "startups",
  "fintech",
  "creator-business"
] as const;

export type CoreCategory = (typeof CORE_CATEGORIES)[number];

export const CATEGORY_SEO_DESCRIPTIONS: Record<CoreCategory, string> = {
  "ai-tools":
    "Discover the latest AI tools and automation software designed to increase margins for founders and operators. We track practical platforms, workflow shifts, and monetization angles before they become obvious.",
  "digital-marketing":
    "Follow digital marketing moves that affect acquisition costs, channel strategy, and revenue growth. These briefings focus on tactics and platforms operators can turn into measurable pipeline.",
  seo:
    "Stay ahead of search updates, content systems, and organic growth plays that compound over time. Our SEO coverage connects algorithm changes to practical traffic and revenue opportunities.",
  ecommerce:
    "Explore ecommerce trends, tools, and marketplace shifts that help brands improve conversion, retention, and margins. Coverage is built for operators who need commercial signal, not generic retail news.",
  startups:
    "Track startup funding, product launches, and operator lessons with a focus on business models and go-to-market leverage. Each briefing highlights what founders can learn or use immediately.",
  fintech:
    "Monitor fintech products, payments infrastructure, and financial software trends shaping new revenue channels. We focus on the operational and monetization impact behind each market move.",
  "creator-business":
    "Learn how creators, media operators, and solo founders are building durable internet businesses. Coverage focuses on audience monetization, tooling, distribution, and repeatable revenue systems."
};

export function isCoreCategory(category: string): category is CoreCategory {
  return CORE_CATEGORIES.includes(category as CoreCategory);
}
