import { FREE_TOOLS } from "@/lib/free-tools";

export type ToolCategory =
  | "advanced-seo"
  | "content"
  | "revenue"
  | "social"
  | "utilities";

export type ToolPageSeo = {
  href: string;
  category: ToolCategory;
  tags: string[];
  primaryKeyword: string;
  relatedToolHrefs: string[];
  relatedComparisonSlugs?: string[];
  editorialTopicIds?: string[];
  problem: string;
  howToSteps: string[];
  workflows: string[];
  faqs: Array<{ question: string; answer: string }>;
};

export const TOOL_CATEGORIES: Array<{
  id: ToolCategory;
  label: string;
  description: string;
}> = [
  {
    id: "advanced-seo",
    label: "Advanced SEO",
    description: "Keyword clusters, SERP intent, and content gap analysis."
  },
  {
    id: "content",
    label: "Content",
    description: "Briefs, titles, metas, and FAQ generators."
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "AdSense, ROAS, newsletter, and SaaS calculators."
  },
  {
    id: "social",
    label: "Social",
    description: "Thumbnails, hooks, cards, and meme tools."
  },
  {
    id: "utilities",
    label: "Utilities",
    description: "UTM links, robots.txt, compression, and naming."
  }
];

export const TOOL_WORKFLOWS = [
  {
    id: "plan-seo",
    title: "Plan SEO content",
    description: "Research intent, cluster keywords, and draft publishable pages.",
    toolHrefs: [
      "/keyword-cluster-tool",
      "/serp-intent-analyzer",
      "/content-brief-generator",
      "/blog-title-generator",
      "/meta-description-generator"
    ],
    accent: "from-indigo-600 via-violet-500 to-fuchsia-500"
  },
  {
    id: "estimate-revenue",
    title: "Estimate revenue",
    description: "Model ads, newsletters, and SaaS before you scale spend.",
    toolHrefs: [
      "/adsense-revenue-calculator",
      "/cpm-rpm-calculator",
      "/newsletter-revenue-calculator",
      "/roas-calculator"
    ],
    accent: "from-emerald-600 via-teal-500 to-cyan-500"
  },
  {
    id: "improve-pages",
    title: "Improve existing pages",
    description: "Find gaps vs competitors and fix structure, FAQs, and CTAs.",
    toolHrefs: [
      "/content-gap-finder",
      "/faq-generator",
      "/meta-description-generator",
      "/robots-txt-generator"
    ],
    accent: "from-amber-500 via-orange-500 to-rose-500"
  },
  {
    id: "track-campaigns",
    title: "Track campaigns",
    description: "Build UTMs and measure ROAS on affiliate and paid traffic.",
    toolHrefs: ["/utm-builder", "/roas-calculator", "/adsense-ctr-calculator"],
    accent: "from-stone-800 via-slate-600 to-blue-600"
  }
];

/** Priority tools with full SEO blocks; others use defaults from FREE_TOOLS. */
export const TOOL_PAGE_SEO: ToolPageSeo[] = [
  {
    href: "/keyword-cluster-tool",
    category: "advanced-seo",
    tags: ["keyword research", "SEO clusters", "search intent"],
    primaryKeyword: "keyword cluster tool",
    relatedToolHrefs: [
      "/serp-intent-analyzer",
      "/content-brief-generator",
      "/blog-title-generator",
      "/content-gap-finder"
    ],
    relatedComparisonSlugs: ["semrush-vs-ahrefs", "ahrefs-vs-moz"],
    editorialTopicIds: ["keyword-cluster-tool-guide", "how-to-do-keyword-research-with-ai"],
    problem:
      "Publishing without keyword structure leads to thin pages that compete with each other. Clustering groups terms by intent so each URL has a clear job.",
    howToSteps: [
      "Enter a seed topic or head term you want to rank for.",
      "Review autocomplete-backed variants and AI-generated long-tail ideas.",
      "Use clusters to decide hub pages, supporting articles, and FAQ targets.",
      "Export angles into the content brief or title generators."
    ],
    workflows: [
      "Hub-and-spoke content planning for a new category",
      "Grouping FAQ pages vs comparison vs tutorial intent",
      "Finding quick-win long-tail pages before writing"
    ],
    faqs: [
      {
        question: "Does this tool show search volume?",
        answer:
          "No. It focuses on intent grouping and page recommendations without inventing volume or difficulty metrics."
      },
      {
        question: "What data sources does it use?",
        answer:
          "Google autocomplete suggestions plus OpenAI analysis. Results stay server-side; API keys are not exposed to the browser."
      }
    ]
  },
  {
    href: "/serp-intent-analyzer",
    category: "advanced-seo",
    tags: ["SERP analysis", "search intent", "content strategy"],
    primaryKeyword: "SERP intent analyzer",
    relatedToolHrefs: [
      "/keyword-cluster-tool",
      "/content-brief-generator",
      "/content-gap-finder",
      "/meta-description-generator"
    ],
    editorialTopicIds: ["serp-intent-analyzer-guide", "seo-content-brief-template"],
    problem:
      "Ranking requires matching what Google already rewards. This tool summarizes live SERP patterns so you pick the right page type and outline.",
    howToSteps: [
      "Enter the exact keyword you want to target.",
      "Review dominant page types (guides, lists, tools, comparisons).",
      "Note content gaps a smaller publisher can realistically fill.",
      "Turn outline ideas into a brief, titles, and meta descriptions."
    ],
    workflows: [
      "Choosing between a tool page, comparison, or long-form guide",
      "Validating whether a keyword is informational vs commercial",
      "Building outlines from People Also Ask questions"
    ],
    faqs: [
      {
        question: "Do I need Serper for live SERP data?",
        answer:
          "Yes for full live analysis. Without SERPER_API_KEY, you still get guidance but not live organic results."
      },
      {
        question: "Can this replace Ahrefs or Semrush?",
        answer:
          "It complements them for intent and outline planning. Use dedicated SEO suites for backlinks and rank tracking."
      }
    ]
  },
  {
    href: "/content-gap-finder",
    category: "advanced-seo",
    tags: ["content gap analysis", "competitor SEO", "on-page SEO"],
    primaryKeyword: "content gap finder",
    relatedToolHrefs: [
      "/serp-intent-analyzer",
      "/faq-generator",
      "/content-brief-generator",
      "/meta-description-generator"
    ],
    editorialTopicIds: ["content-gap-finder-guide", "internal-linking-best-practices"],
    problem:
      "Your page may rank on page two because competitors cover sections, FAQs, or examples you skipped. Gap analysis surfaces what to add without fluff.",
    howToSteps: [
      "Paste your URL and two or three competitor URLs ranking for the same topic.",
      "Run the comparison to fetch page text (when accessible).",
      "Prioritize missing sections, weak coverage, and FAQ gaps.",
      "Ship edits, then re-check with the brief or meta generators."
    ],
    workflows: [
      "Refreshing an underperforming article or tool landing page",
      "Beating comparison pages with deeper decision tables",
      "Adding FAQ blocks that match People Also Ask"
    ],
    faqs: [
      {
        question: "Why might competitor text be empty?",
        answer:
          "Some sites block bots or render content in JavaScript. Add more competitors or paste key sections manually if fetch fails."
      },
      {
        question: "Is word count the goal?",
        answer:
          "No. The tool prioritizes usefulness—structure, examples, FAQs, and operator-focused coverage—not padding."
      }
    ]
  },
  {
    href: "/content-brief-generator",
    category: "content",
    tags: ["content brief", "SEO outline", "blog planning"],
    primaryKeyword: "content brief generator",
    relatedToolHrefs: [
      "/keyword-cluster-tool",
      "/blog-title-generator",
      "/meta-description-generator",
      "/faq-generator"
    ],
    editorialTopicIds: ["seo-content-brief-template"],
    problem:
      "Writers stall without intent, headings, and FAQ targets. A brief aligns SEO and editorial before the first draft.",
    howToSteps: [
      "Enter a target keyword or working title.",
      "Review suggested H2s, search intent, and FAQ questions.",
      "Pick a CTA aligned with monetization (tool, comparison, newsletter).",
      "Draft in your CMS; link internally to tools and comparisons."
    ],
    workflows: [
      "Editorial calendar planning for a new niche",
      "Briefing freelancers or AI drafts with structure",
      "Pairing briefs with cluster and SERP tools"
    ],
    faqs: [
      {
        question: "Is this the same as the advanced SEO tools?",
        answer:
          "The brief generator is lightweight and instant in-browser. Advanced tools use server APIs for deeper SERP and gap analysis."
      }
    ]
  },
  {
    href: "/blog-title-generator",
    category: "content",
    tags: ["blog titles", "SEO headlines", "title ideas"],
    primaryKeyword: "blog title generator",
    relatedToolHrefs: [
      "/meta-description-generator",
      "/ai-headline-generator",
      "/content-brief-generator",
      "/keyword-cluster-tool"
    ],
    editorialTopicIds: ["ai-headline-generator-workflow"],
    problem:
      "Titles drive CTR from search and social. This generator produces angle variations you can test without generic AI slop.",
    howToSteps: [
      "Enter topic, audience, or primary keyword.",
      "Shortlist titles that match intent (how-to, list, comparison).",
      "Pair the winner with a meta description from the meta generator.",
      "Track CTR in Search Console after publish."
    ],
    workflows: ["SERP title tests", "Newsletter subject line variants", "Comparison page headlines"],
    faqs: [
      {
        question: "Should I use the exact generated title?",
        answer:
          "Treat output as drafts. Edit for brand voice, accuracy, and length limits (typically under ~60 characters for SEO titles)."
      }
    ]
  },
  {
    href: "/meta-description-generator",
    category: "content",
    tags: ["meta description", "SERP snippet", "SEO copy"],
    primaryKeyword: "meta description generator",
    relatedToolHrefs: [
      "/blog-title-generator",
      "/content-brief-generator",
      "/serp-intent-analyzer",
      "/robots-txt-generator"
    ],
    editorialTopicIds: ["use-ai-for-seo-meta-descriptions", "meta-description-examples"],
    problem:
      "Weak meta descriptions hurt CTR even when rankings are decent. Generate intent-matched snippets for articles, tools, and landing pages.",
    howToSteps: [
      "Provide the page topic and primary keyword.",
      "Select a description that promises a clear outcome.",
      "Keep within ~150–160 characters when possible.",
      "Align with the on-page H1 so snippets stay trustworthy."
    ],
    workflows: [
      "Tool and comparison landing page snippets",
      "Refreshing metas on pages with impressions but low CTR",
      "Pairing with title tests from the blog title generator"
    ],
    faqs: [
      {
        question: "Do meta descriptions affect rankings?",
        answer:
          "They are not a direct ranking factor for Google, but they influence CTR, which affects traffic from the same position."
      }
    ]
  },
  {
    href: "/adsense-revenue-calculator",
    category: "revenue",
    tags: ["AdSense calculator", "publisher revenue", "RPM estimate"],
    primaryKeyword: "AdSense revenue calculator",
    relatedToolHrefs: [
      "/adsense-ctr-calculator",
      "/cpm-rpm-calculator",
      "/newsletter-revenue-calculator",
      "/utm-builder"
    ],
    relatedComparisonSlugs: ["mediavine-vs-adsense"],
    editorialTopicIds: ["adsense-rpm-calculator-guide", "programmatic-seo-for-small-sites"],
    problem:
      "Publishers guess ad revenue instead of modeling pageviews, CTR, CPC, and viewability. Estimates set expectations before applying to networks.",
    howToSteps: [
      "Enter monthly pageviews and realistic CTR/CPC assumptions.",
      "Adjust viewability if you know ad slot performance.",
      "Compare scenarios (conservative vs optimistic).",
      "Use results to decide ad layout tests or network upgrades."
    ],
    workflows: [
      "AdSense approval planning",
      "Evaluating Mediavine vs AdSense tradeoffs",
      "Forecasting revenue if traffic doubles"
    ],
    faqs: [
      {
        question: "Are these revenue numbers guaranteed?",
        answer:
          "No. They are estimates based on your inputs. Actual RPM varies by niche, geo, seasonality, and ad layout."
      }
    ]
  },
  {
    href: "/utm-builder",
    category: "utilities",
    tags: ["UTM builder", "campaign tracking", "marketing links"],
    primaryKeyword: "UTM link builder",
    relatedToolHrefs: [
      "/roas-calculator",
      "/adsense-revenue-calculator",
      "/blog-title-generator",
      "/content-brief-generator"
    ],
    editorialTopicIds: ["utm-tracking-for-affiliates"],
    problem:
      "Untagged links hide which campaigns drive signups or affiliate revenue. UTMs make channel performance visible in analytics.",
    howToSteps: [
      "Paste the destination URL (article, tool, or referral page).",
      "Set source, medium, and campaign names consistently.",
      "Copy the tagged URL for email, social, or paid ads.",
      "Review performance in analytics after traffic arrives."
    ],
    workflows: [
      "Affiliate and referral link tracking",
      "Newsletter and social distribution",
      "Paid campaign post-click measurement with ROAS calculator"
    ],
    faqs: [
      {
        question: "What naming convention should I use?",
        answer:
          "Keep utm_source (platform), utm_medium (channel type), and utm_campaign (initiative) stable so reports stay comparable month to month."
      }
    ]
  }
];

const seoByHref = new Map(TOOL_PAGE_SEO.map((entry) => [entry.href, entry]));

export function getToolPageSeo(href: string): ToolPageSeo | undefined {
  return seoByHref.get(href);
}

export function getToolsByCategory(category: ToolCategory) {
  return FREE_TOOLS.filter((tool) => {
    const seo = seoByHref.get(tool.href);
    if (seo) {
      return seo.category === category;
    }

    return inferCategory(tool.href) === category;
  });
}

function inferCategory(href: string): ToolCategory {
  if (
    href.includes("keyword") ||
    href.includes("serp") ||
    href.includes("content-gap")
  ) {
    return "advanced-seo";
  }

  if (
    href.includes("adsense") ||
    href.includes("revenue") ||
    href.includes("cpm") ||
    href.includes("roas") ||
    href.includes("saas-pricing") ||
    href.includes("cac-payback") ||
    href.includes("newsletter-revenue")
  ) {
    return "revenue";
  }

  if (
    href.includes("meme") ||
    href.includes("thumbnail") ||
    href.includes("tiktok") ||
    href.includes("youtube") ||
    href.includes("x-card") ||
    href.includes("linkedin")
  ) {
    return "social";
  }

  if (
    href.includes("utm") ||
    href.includes("robots") ||
    href.includes("compressor") ||
    href.includes("startup-name")
  ) {
    return "utilities";
  }

  return "content";
}

export function getRelatedTools(href: string, limit = 4) {
  const seo = getToolPageSeo(href);

  if (seo?.relatedToolHrefs.length) {
    return seo.relatedToolHrefs
      .map((relatedHref) => FREE_TOOLS.find((t) => t.href === relatedHref))
      .filter((t): t is (typeof FREE_TOOLS)[number] => Boolean(t))
      .slice(0, limit);
  }

  return FREE_TOOLS.filter((t) => t.href !== href).slice(0, limit);
}

export function isPriorityTool(href: string) {
  return seoByHref.has(href);
}
