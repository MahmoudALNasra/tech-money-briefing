import type { CoreCategory } from "@/lib/categories";
import { formatCategory } from "@/lib/format";
import { getRecommendedToolsForText } from "@/lib/tool-recommendations";
import { getRelatedTools, getToolPageSeo } from "@/lib/tool-pages";
import type { Article } from "@/lib/types";

export type HumanAction = {
  href: string;
  label: string;
  description: string;
  variant?: "primary" | "secondary";
};

export type ArticleHumanLayer = {
  plainEnglish: string;
  whoShouldCare: string[];
  operatorTake: string;
  testFirst: string[];
  mistakes: string[];
  scenario: {
    title: string;
    setup: string;
    outcome: string;
  };
  nextActions: HumanAction[];
};

export type ToolHumanLayer = {
  beforeYouRun: string[];
  howToRead: string[];
  goodSignal: string;
  badSignal: string;
  operatorTake: string;
  scenario: {
    title: string;
    setup: string;
    outcome: string;
  };
  nextActions: HumanAction[];
};

const CATEGORY_OPERATOR_TAKES: Record<CoreCategory, string> = {
  "ai-tools":
    "We would not chase every AI announcement. Pick one workflow bottleneck—writing, coding, SEO, or ops—and test whether the tool actually saves time after the free trial ends.",
  "digital-marketing":
    "We would tie every channel decision to a measurable outcome: CTR, CAC, ROAS, or email conversion. If you cannot name the metric, the tactic is probably vanity.",
  seo:
    "We would prioritize pages that already get impressions but underperform on CTR or depth—not brand-new thin pages built only to chase keywords.",
  ecommerce:
    "We would model margin after fees, returns, and ad spend before scaling traffic. Traffic without contribution margin is just expensive attention.",
  startups:
    "We would validate one distribution channel and one monetization path before adding more tools to the stack.",
  fintech:
    "We would read pricing, compliance, and integration cost together. A cheaper tool that breaks reconciliation is not cheaper.",
  "creator-business":
    "We would protect audience trust first. Monetization that hurts open rates or engagement usually costs more later.",
  others:
    "We would treat trending topics as demand signals, then publish one useful page or tool workflow—not ten reactive posts with no unique angle."
};

const CATEGORY_SCENARIOS: Record<
  CoreCategory,
  { title: string; setup: string; outcome: string }
> = {
  "ai-tools": {
    title: "Example: testing an AI coding tool on a real shipping week",
    setup:
      "A solo founder ships 2 features per month and spends ~6 hours/week on boilerplate refactors.",
    outcome:
      "If the tool saves 90+ minutes per week on scoped tasks without introducing review debt, it is worth paying for. If not, keep the free tier and revisit after the workflow is clearer."
  },
  "digital-marketing": {
    title: "Example: paid search test for a SaaS landing page",
    setup:
      "A B2B site spends $800/month on one campaign with 2.1% CTR and 1.4% trial signup rate.",
    outcome:
      "Fix landing-page-message match before raising budget. A 0.3-point CTR lift often beats doubling spend on the wrong page."
  },
  seo: {
    title: "Example: publisher with 25k monthly visits",
    setup:
      "Organic traffic is flat, but Search Console shows 40+ queries on page 2 with decent impressions.",
    outcome:
      "Refresh 5 near-win pages with better intros, FAQs, and internal links before publishing 20 new thin articles."
  },
  ecommerce: {
    title: "Example: DTC store evaluating checkout friction",
    setup:
      "Mobile add-to-cart is strong, but checkout completion drops 18% vs desktop.",
    outcome:
      "Simplify payment options and shipping clarity on mobile first. That often beats another top-of-funnel campaign."
  },
  startups: {
    title: "Example: early SaaS choosing a billing stack",
    setup:
      "A 200-customer product needs subscriptions, tax handling, and a simple upgrade path.",
    outcome:
      "Pick the stack that reduces finance ops time, not the one with the flashiest feature list."
  },
  fintech: {
    title: "Example: SMB comparing payment processors",
    setup:
      "A services business processes $40k/month with mixed invoice and card payments.",
    outcome:
      "Optimize for net margin and payout speed, then negotiate volume pricing once volume is stable."
  },
  "creator-business": {
    title: "Example: newsletter operator testing sponsorship pricing",
    setup:
      "12k subscribers, 42% open rate, one sponsor slot per issue.",
    outcome:
      "Price on engaged readers and click-through to offers—not raw list size alone."
  },
  others: {
    title: "Example: trend-driven publisher",
    setup:
      "A spike query arrives Monday; the team wants 5 posts live by Wednesday.",
    outcome:
      "Publish one definitive guide plus one tool or checklist. Skip four shallow takes that will not rank next week."
  }
};

function detectArticleAngle(article: Article) {
  const haystack = `${article.title} ${article.meta_description} ${article.content.slice(0, 800)}`.toLowerCase();

  if (/copilot|cursor|claude|chatgpt|ai tool|github/.test(haystack)) {
    return "ai-product";
  }

  if (/adsense|revenue|rpm|cpm|monetiz|affiliate/.test(haystack)) {
    return "monetization";
  }

  if (/seo|serp|keyword|search intent|ranking/.test(haystack)) {
    return "seo-workflow";
  }

  if (/shopify|ecommerce|store|checkout/.test(haystack)) {
    return "ecommerce";
  }

  return "general";
}

function articleMistakes(category: CoreCategory, angle: string) {
  const base = [
    "Publishing a summary without a clear recommendation or next step.",
    "Chasing every related keyword instead of one primary page job.",
    "Ignoring Search Console or analytics when the topic is search-driven."
  ];

  if (angle === "ai-product") {
    return [
      ...base,
      "Switching tools before measuring whether the old workflow was the real bottleneck.",
      "Assuming token-based pricing will match your actual usage pattern."
    ];
  }

  if (angle === "monetization") {
    return [
      ...base,
      "Projecting revenue from best-case RPM or conversion assumptions.",
      "Adding ad density before the site has enough trust and depth."
    ];
  }

  if (angle === "seo-workflow") {
    return [
      ...base,
      "Creating near-duplicate pages for every long-tail variant.",
      "Optimizing titles for clicks without matching intent on the page."
    ];
  }

  if (category === "ecommerce") {
    return [
      ...base,
      "Scaling ad spend before fixing product page clarity and trust cues."
    ];
  }

  return base;
}

function articleTestFirst(category: CoreCategory, angle: string) {
  if (angle === "ai-product") {
    return [
      "Run one real task end-to-end and log time saved vs review time added.",
      "Compare total monthly cost at your realistic usage tier.",
      "Check whether output quality is good enough to ship without heavy editing."
    ];
  }

  if (angle === "monetization") {
    return [
      "Model revenue with conservative CTR, conversion, and churn assumptions.",
      "Check policy and user experience impact before adding more ad slots.",
      "Pick one monetization lever to improve this month (ads, affiliate, or email)."
    ];
  }

  if (angle === "seo-workflow") {
    return [
      "Inspect the top 5 ranking pages and note page type + depth.",
      "Update one existing page before creating a new URL.",
      "Add FAQ and internal links to a related tool or comparison page."
    ];
  }

  return [
    "Define the one decision this article should help the reader make.",
    "Add a concrete example with numbers, even if approximate.",
    "Link to one tool, one comparison, or the contact form for help."
  ];
}

function buildArticleNextActions(article: Article): HumanAction[] {
  const tools = getRecommendedToolsForText(
    [
      article.title,
      article.meta_description,
      article.category,
      article.key_takeaways.join(" ")
    ].join(" "),
    3,
    true
  );

  const actions: HumanAction[] = tools.slice(0, 2).map((tool) => ({
    href: tool.href,
    label: tool.title.replace(/^Free /i, ""),
    description: "Run a related workflow on this site.",
    variant: "secondary" as const
  }));

  actions.unshift({
    href: "/tools",
    label: "Browse free tools",
    description: "Turn this topic into titles, briefs, SEO checks, or revenue estimates.",
    variant: "primary"
  });

  actions.push({
    href: `/contact?topic=help&page=${encodeURIComponent(`/${article.category}/${article.slug}`)}`,
    label: "Get hands-on help",
    description: "Tell us your site and goal—we reply with practical next steps.",
    variant: "secondary"
  });

  return actions.slice(0, 4);
}

export function getArticleHumanLayer(article: Article): ArticleHumanLayer {
  const category = article.category as CoreCategory;
  const angle = detectArticleAngle(article);
  const takeawayLead =
    article.key_takeaways[0] ??
    article.meta_description ??
    "Start with the direct answer, then validate the decision against your own traffic and goals.";

  return {
    plainEnglish: `${takeawayLead} This briefing is written for operators who want a fast read first, then a practical plan—not a generic news recap.`,
    whoShouldCare: [
      `${formatCategory(category)} operators evaluating their next move`,
      "Founders and publishers who need a decision framework, not more hype",
      angle === "monetization"
        ? "Teams modeling revenue, ads, affiliates, or newsletter monetization"
        : "Teams turning search demand into pages, tools, or offers"
    ],
    operatorTake: CATEGORY_OPERATOR_TAKES[category] ?? CATEGORY_OPERATOR_TAKES.others,
    testFirst: articleTestFirst(category, angle),
    mistakes: articleMistakes(category, angle),
    scenario: CATEGORY_SCENARIOS[category] ?? CATEGORY_SCENARIOS.others,
    nextActions: buildArticleNextActions(article)
  };
}

const TOOL_HUMAN: Record<
  string,
  Partial<ToolHumanLayer> & { operatorTake: string }
> = {
  "/keyword-cluster-tool": {
    operatorTake:
      "Clusters are for planning page structure, not for publishing 30 URLs at once. We would ship one hub page and 2-4 supporting pages, then measure.",
    goodSignal:
      "You see 3-6 tight clusters with clear page types (guide, comparison, tool) and obvious quick wins.",
    badSignal:
      "Dozens of overlapping clusters with no page recommendation—usually a sign the seed keyword is too broad.",
    howToRead: [
      "Start with summary and quick wins—those tell you what to publish first.",
      "Use each cluster's page type to decide: article vs tool vs comparison.",
      "Export CSV/XLSX and share with whoever writes content."
    ]
  },
  "/serp-intent-analyzer": {
    operatorTake:
      "Match the dominant page type before you write. If Google shows tools and comparisons, a long opinion essay rarely wins.",
    goodSignal:
      "Intent is clear, page types repeat, and you get outline ideas you would actually publish.",
    badSignal:
      "Mixed intent with no pattern—narrow the keyword or pick a more specific long-tail."
  },
  "/content-gap-finder": {
    operatorTake:
      "Gap analysis is about usefulness, not word count. Add sections readers need to choose or act—not filler paragraphs.",
    goodSignal:
      "A short list of missing sections and FAQ gaps you can implement this week.",
    badSignal:
      "Huge lists of generic suggestions with no priority—focus on priority fixes only."
  },
  "/content-brief-generator": {
    operatorTake:
      "A brief is the outline for one page job. If the brief tries to do everything, the published page will too.",
    goodSignal:
      "Clear H2s, FAQ targets, and a CTA that matches monetization intent.",
    badSignal:
      "Vague sections that could apply to any topic in your niche."
  },
  "/adsense-revenue-calculator": {
    operatorTake:
      "Run conservative and optimistic scenarios. If only the optimistic case works, fix traffic quality or layout before applying to AdSense.",
    goodSignal:
      "You can explain which lever moves revenue most: traffic, CTR, CPC, or viewability.",
    badSignal:
      "Tiny input changes create unrealistic 10x swings—re-check assumptions."
  },
  "/utm-builder": {
    operatorTake:
      "Consistent UTM naming beats clever naming. You want reports you can read in 6 months without guessing what campaign_042 meant.",
    goodSignal:
      "Every link has source, medium, and campaign that maps to how you actually report.",
    badSignal:
      "Inconsistent tags across channels—clean up before scaling spend."
  }
};

function defaultToolHuman(href: string, title: string): ToolHumanLayer {
  const seo = getToolPageSeo(href);
  const related = getRelatedTools(href, 3);

  return {
    beforeYouRun: [
      "Use a real keyword or URL you care about—not a placeholder.",
      "Have one goal: plan content, fix a page, or estimate revenue.",
      seo
        ? "Skim the how-to steps below so you know what a strong output looks like."
        : "Expect a draft you will still edit for voice and accuracy."
    ],
    howToRead: [
      "Treat the result as a draft plan, not final copy.",
      "Look for 1-3 actions you can do today, ignore the rest.",
      "Use exports if you need to share with a writer or client."
    ],
    goodSignal:
      "The output gives you a clear next page to build or a clear fix to make.",
    badSignal:
      "The output is generic and could apply to any niche without changes.",
    operatorTake:
      seo?.problem ??
      `We use ${title} to speed up decisions, then validate against real traffic and business constraints.`,
    scenario: {
      title: "Example workflow",
      setup: `You run ${title} on one real project you are working on this week.`,
      outcome:
        "You leave with one publishable asset or one metric to improve—not a pile of unused ideas."
    },
    nextActions: [
      ...related.slice(0, 2).map((tool) => ({
        href: tool.href,
        label: tool.title.replace(/^Free /i, ""),
        description: "Continue the workflow with a related tool.",
        variant: "secondary" as const
      })),
      {
        href: "/contact",
        label: "Ask for a review",
        description: "Not sure how to interpret the result? We can help.",
        variant: "secondary"
      }
    ]
  };
}

export function getToolHumanLayer(href: string, title: string): ToolHumanLayer {
  const custom = TOOL_HUMAN[href];
  const base = defaultToolHuman(href, title);

  if (!custom) {
    return base;
  }

  return {
    ...base,
    ...custom,
    scenario: custom.scenario ?? base.scenario,
    nextActions: custom.nextActions ?? base.nextActions,
    beforeYouRun: custom.beforeYouRun ?? base.beforeYouRun,
    howToRead: custom.howToRead ?? base.howToRead
  };
}
