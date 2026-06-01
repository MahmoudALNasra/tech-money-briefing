import type { CoreCategory } from "@/lib/categories";

export type EditorialTopic = {
  id: string;
  title: string;
  category: CoreCategory;
  angle: string;
  referenceUrls?: string[];
};

/**
 * Evergreen tutorial/how-to queue. Each topic is published at most once
 * (tracked via source_url `editorial://<id>`).
 */
export const EDITORIAL_TOPICS: EditorialTopic[] = [
  {
    id: "how-to-use-cursor-for-coding",
    title: "How to Use Cursor for Coding: A Practical Setup Guide",
    category: "ai-tools",
    angle:
      "Step-by-step workflow for installing Cursor, using Composer and chat, referencing code with @-mentions, and shipping features faster without breaking your repo.",
    referenceUrls: ["https://cursor.com/docs"]
  },
  {
    id: "cursor-vs-chatgpt-for-coding",
    title: "Cursor vs ChatGPT for Coding: When to Use Each",
    category: "ai-tools",
    angle:
      "Compare IDE-integrated AI (Cursor) vs general chat (ChatGPT) for debugging, refactors, greenfield builds, and code review.",
    referenceUrls: ["https://cursor.com", "https://openai.com/chatgpt"]
  },
  {
    id: "cursor-rules-for-better-output",
    title: "How to Write Cursor Rules That Improve AI Output",
    category: "ai-tools",
    angle:
      "Explain project rules, .cursorrules patterns, and how to encode stack, style, and testing expectations so the agent stays on-brand.",
    referenceUrls: ["https://cursor.com/docs"]
  },
  {
    id: "chatgpt-for-blog-writing-workflow",
    title: "How to Use ChatGPT for Blog Writing Without Sounding Generic",
    category: "creator-business",
    angle:
      "Outline → draft → fact-check → SEO polish workflow for publishers; include prompts and quality checks.",
    referenceUrls: ["https://openai.com/chatgpt"]
  },
  {
    id: "claude-for-long-form-analysis",
    title: "How to Use Claude for Long-Form Research and Analysis",
    category: "ai-tools",
    angle:
      "When Claude fits better than ChatGPT for long documents, synthesis, and structured briefings; include practical limits and verification habits.",
    referenceUrls: ["https://www.anthropic.com/claude"]
  },
  {
    id: "ai-headline-generator-workflow",
    title: "How to Use an AI Headline Generator in Your Publishing Stack",
    category: "digital-marketing",
    angle:
      "Connect headline testing to CTR, SERP snippets, and newsletter subject lines; mention on-site tools where relevant.",
    referenceUrls: []
  },
  {
    id: "build-daily-content-workflow-with-ai",
    title: "How to Build a Daily Content Workflow With AI Tools",
    category: "creator-business",
    angle:
      "Morning research, drafting, internal linking, and publish checklist for solo operators using RSS, trends, and AI assistants.",
    referenceUrls: []
  },
  {
    id: "use-ai-for-seo-meta-descriptions",
    title: "How to Use AI for SEO Meta Descriptions That Actually Convert",
    category: "seo",
    angle:
      "Character limits, intent matching, avoiding clickbait, and pairing meta copy with title tests.",
    referenceUrls: []
  },
  {
    id: "notion-ai-vs-manual-docs",
    title: "How to Use Notion AI for Operator Documentation",
    category: "startups",
    angle:
      "SOPs, playbooks, and meeting notes with AI; when to keep human-owned source of truth.",
    referenceUrls: ["https://www.notion.so/product/ai"]
  },
  {
    id: "github-copilot-vs-cursor",
    title: "GitHub Copilot vs Cursor: Which Fits Your Team?",
    category: "ai-tools",
    angle:
      "Team adoption, privacy, IDE support, and cost framing for small engineering teams.",
    referenceUrls: ["https://github.com/features/copilot", "https://cursor.com"]
  },
  {
    id: "ai-tools-for-solo-founders",
    title: "Best AI Tools for Solo Founders in 2026 (Stack, Not Hype)",
    category: "startups",
    angle:
      "Curated stack: coding (Cursor), writing (ChatGPT/Claude), design shortcuts, and analytics—tie each to a job-to-be-done.",
    referenceUrls: []
  },
  {
    id: "use-perplexity-for-research",
    title: "How to Use Perplexity for Market and Competitor Research",
    category: "digital-marketing",
    angle:
      "Citation-first research for positioning pages, comparison articles, and launch briefs.",
    referenceUrls: ["https://www.perplexity.ai"]
  },
  {
    id: "midjourney-for-marketing-assets",
    title: "How to Use Midjourney for Marketing Visuals (Without Brand Drift)",
    category: "digital-marketing",
    angle:
      "Prompt patterns for social cards, thumbnails, and ad creatives; brand consistency guardrails.",
    referenceUrls: ["https://www.midjourney.com"]
  },
  {
    id: "automate-newsletter-drafts-with-ai",
    title: "How to Automate Newsletter Drafts With AI (Safely)",
    category: "creator-business",
    angle:
      "Beehiiv/Substack operators: curation → summary → CTA; compliance and voice guidelines.",
    referenceUrls: []
  },
  {
    id: "ai-for-ecommerce-product-copy",
    title: "How to Use AI for Ecommerce Product Copy and PDP SEO",
    category: "ecommerce",
    angle:
      "Shopify/Woo operators: variant copy, FAQs, and schema-friendly descriptions with human QA.",
    referenceUrls: []
  },
  {
    id: "fintech-founders-ai-compliance",
    title: "How Fintech Founders Can Use AI Without Compliance Surprises",
    category: "fintech",
    angle:
      "PII boundaries, model policies, and human review for customer-facing copy—not legal advice, practical ops checklist.",
    referenceUrls: []
  },
  {
    id: "cursor-agent-mode-explained",
    title: "Cursor Agent Mode Explained for Non-Engineer Operators",
    category: "ai-tools",
    angle:
      "What agent mode does, when to enable it, and how to scope tasks so changes stay reviewable.",
    referenceUrls: ["https://cursor.com/docs"]
  },
  {
    id: "prompt-library-for-publishers",
    title: "How to Build a Prompt Library for Your Publishing Team",
    category: "creator-business",
    angle:
      "Versioned prompts for outlines, FAQs, internal links, and tone; store in Notion or repo.",
    referenceUrls: []
  },
  {
    id: "ai-image-compressor-workflow",
    title: "How to Compress Images for Core Web Vitals (Tool + Workflow)",
    category: "seo",
    angle:
      "WebP/PNG tradeoffs, lazy loading, and using an on-site compressor before publish.",
    referenceUrls: []
  },
  {
    id: "youtube-title-generator-workflow",
    title: "How to Use a YouTube Title Generator in Your Creator Workflow",
    category: "creator-business",
    angle:
      "Hook formulas, A/B mindset, and pairing titles with thumbnails and first-30-seconds scripts.",
    referenceUrls: []
  },
  {
    id: "utm-builder-for-campaign-tracking",
    title: "How to Use a UTM Builder for Clean Campaign Attribution",
    category: "digital-marketing",
    angle:
      "Naming conventions, GA4 alignment, and avoiding attribution chaos across channels.",
    referenceUrls: []
  },
  {
    id: "adsense-rpm-calculator-guide",
    title: "How to Use an AdSense RPM Calculator to Forecast Revenue",
    category: "creator-business",
    angle:
      "Pageviews, RPM, seasonality, and realistic scenarios for publisher planning.",
    referenceUrls: []
  },
  {
    id: "compare-ai-writing-tools",
    title: "ChatGPT vs Claude vs Gemini for Writing: A Practical Comparison",
    category: "ai-tools",
    angle:
      "Strengths by task type (short copy, long research, formatting); no fanboy tone.",
    referenceUrls: []
  },
  {
    id: "cursor-for-nextjs-projects",
    title: "How to Use Cursor to Build and Ship a Next.js Site Faster",
    category: "ai-tools",
    angle:
      "App Router patterns, env setup, deploy checklist, and pairing Cursor with Vercel.",
    referenceUrls: ["https://cursor.com/docs", "https://nextjs.org/docs"]
  },
  {
    id: "ai-internal-linking-for-seo",
    title: "How to Use AI and Internal Linking to Grow Topical Authority",
    category: "seo",
    angle:
      "Hub pages, tools, comparisons, and contextual links between briefings—operator playbook.",
    referenceUrls: []
  },
  {
    id: "how-to-use-cursor-ai-for-beginners",
    title: "How to Use Cursor AI for Beginners: Setup, Prompts, and Workflow",
    category: "ai-tools",
    angle:
      "Beginner-friendly guide for installing Cursor, opening an existing project, asking safe questions, and making small changes with review habits.",
    referenceUrls: ["https://cursor.com/docs"]
  },
  {
    id: "best-cursor-prompts-for-coding",
    title: "Best Cursor Prompts for Coding: Examples That Actually Help",
    category: "ai-tools",
    angle:
      "Practical prompt patterns for debugging, refactoring, writing tests, explaining unfamiliar code, and planning changes before editing.",
    referenceUrls: ["https://cursor.com/docs"]
  },
  {
    id: "cursor-composer-vs-chat",
    title: "Cursor Composer vs Chat: Which One Should You Use?",
    category: "ai-tools",
    angle:
      "Explain the difference between project-wide editing and conversational code help, with examples for common development tasks.",
    referenceUrls: ["https://cursor.com/docs"]
  },
  {
    id: "how-to-use-cursor-with-github",
    title: "How to Use Cursor With GitHub Without Breaking Your Repo",
    category: "ai-tools",
    angle:
      "Branching, reviewing diffs, committing, avoiding secret leaks, and using Cursor safely on real repositories.",
    referenceUrls: ["https://cursor.com/docs", "https://docs.github.com"]
  },
  {
    id: "chatgpt-prompts-for-seo",
    title: "ChatGPT Prompts for SEO: Titles, Outlines, Meta Descriptions, and FAQs",
    category: "seo",
    angle:
      "Search-intent workflow for using ChatGPT to produce better SEO briefs without publishing thin or generic content.",
    referenceUrls: ["https://openai.com/chatgpt"]
  },
  {
    id: "chatgpt-prompts-for-small-business",
    title: "Best ChatGPT Prompts for Small Business Owners",
    category: "digital-marketing",
    angle:
      "Prompt examples for marketing, customer support, product descriptions, email campaigns, and operations.",
    referenceUrls: ["https://openai.com/chatgpt"]
  },
  {
    id: "how-to-use-chatgpt-for-market-research",
    title: "How to Use ChatGPT for Market Research Without Making Things Up",
    category: "startups",
    angle:
      "Use AI for competitor mapping, customer questions, positioning hypotheses, and research plans while verifying facts externally.",
    referenceUrls: ["https://openai.com/chatgpt"]
  },
  {
    id: "how-to-use-claude-for-coding",
    title: "How to Use Claude for Coding: Best Use Cases and Limits",
    category: "ai-tools",
    angle:
      "When Claude helps with planning, explaining code, writing tests, and long-context review, plus where an IDE agent is better.",
    referenceUrls: ["https://www.anthropic.com/claude"]
  },
  {
    id: "claude-vs-chatgpt-for-business",
    title: "Claude vs ChatGPT for Business: Which AI Assistant Fits Your Workflow?",
    category: "ai-tools",
    angle:
      "Compare writing, research, analysis, coding support, team workflows, and verification habits for operators.",
    referenceUrls: ["https://www.anthropic.com/claude", "https://openai.com/chatgpt"]
  },
  {
    id: "gemini-vs-chatgpt-for-marketing",
    title: "Gemini vs ChatGPT for Marketing: What Each Tool Is Best At",
    category: "digital-marketing",
    angle:
      "Compare campaign planning, content drafting, research, Google ecosystem use cases, and practical limits.",
    referenceUrls: ["https://gemini.google.com", "https://openai.com/chatgpt"]
  },
  {
    id: "ai-tools-for-content-creators",
    title: "Best AI Tools for Content Creators: A Practical Stack",
    category: "creator-business",
    angle:
      "Stack AI tools by job: ideation, scripts, thumbnails, editing, repurposing, newsletters, analytics, and monetization.",
    referenceUrls: []
  },
  {
    id: "ai-tools-for-youtube-creators",
    title: "Best AI Tools for YouTube Creators: Titles, Thumbnails, Scripts, and Analytics",
    category: "creator-business",
    angle:
      "Workflow for YouTube creators from idea to upload, including title formulas, thumbnail concepts, and video research.",
    referenceUrls: []
  },
  {
    id: "how-to-write-youtube-titles-that-get-clicks",
    title: "How to Write YouTube Titles That Get Clicks Without Clickbait",
    category: "creator-business",
    angle:
      "Use curiosity, clarity, audience promise, and thumbnail alignment to improve title quality.",
    referenceUrls: []
  },
  {
    id: "how-to-make-youtube-thumbnails-with-ai",
    title: "How to Make YouTube Thumbnails With AI and Simple Design Rules",
    category: "creator-business",
    angle:
      "Thumbnail workflow: concept, face/object focus, contrast, text, export size, and testing.",
    referenceUrls: []
  },
  {
    id: "blog-title-formulas",
    title: "Blog Title Formulas That Work for SEO and Social Sharing",
    category: "seo",
    angle:
      "Explain title formats for how-to, comparison, best tools, calculators, mistakes, and templates.",
    referenceUrls: []
  },
  {
    id: "meta-description-examples",
    title: "Meta Description Examples: How to Write Snippets That Earn Clicks",
    category: "seo",
    angle:
      "Examples and templates for SaaS, ecommerce, blogs, tools, comparisons, and local-style pages.",
    referenceUrls: []
  },
  {
    id: "how-to-do-keyword-research-with-ai",
    title: "How to Do Keyword Research With AI Without Chasing Bad Keywords",
    category: "seo",
    angle:
      "Use AI for clustering and intent analysis, then validate with real SERPs, trends, and Search Console.",
    referenceUrls: []
  },
  {
    id: "seo-content-brief-template",
    title: "SEO Content Brief Template: What to Include Before You Write",
    category: "seo",
    angle:
      "Brief structure for intent, audience, headings, internal links, tools, FAQs, and quality checks.",
    referenceUrls: []
  },
  {
    id: "keyword-cluster-tool-guide",
    title: "How to Use a Keyword Cluster Tool for Content Planning",
    category: "seo",
    angle:
      "Walk through clustering by intent, picking hub pages, and linking to the free keyword cluster tool, content brief generator, and title tools.",
    referenceUrls: []
  },
  {
    id: "serp-intent-analyzer-guide",
    title: "How to Analyze SERP Intent Before You Write a Page",
    category: "seo",
    angle:
      "Explain dominant page types, People Also Ask, content gaps, and when to build tools vs guides vs comparisons. Link to the SERP intent analyzer and related SEO tools.",
    referenceUrls: []
  },
  {
    id: "content-gap-finder-guide",
    title: "How to Find Content Gaps on Pages That Won't Rank",
    category: "seo",
    angle:
      "Compare your URL to competitors, prioritize missing sections and FAQs, and ship edits without fluff. Link to the content gap finder and FAQ generator.",
    referenceUrls: []
  },
  {
    id: "utm-tracking-for-affiliates",
    title: "How to Use UTM Parameters for Affiliate and Referral Links",
    category: "digital-marketing",
    angle:
      "Naming conventions, campaign structure, and pairing UTMs with ROAS and revenue calculators.",
    referenceUrls: []
  },
  {
    id: "internal-linking-best-practices",
    title: "Internal Linking Best Practices for Blogs, Tools, and Comparison Pages",
    category: "seo",
    angle:
      "Practical internal linking framework for topical authority, crawl paths, and conversion pages.",
    referenceUrls: []
  },
  {
    id: "programmatic-seo-for-small-sites",
    title: "Programmatic SEO for Small Sites: When It Works and When It Fails",
    category: "seo",
    angle:
      "Explain templates, data quality, thin-content risk, and where calculators or comparison pages fit.",
    referenceUrls: []
  },
  {
    id: "how-to-start-a-niche-newsletter",
    title: "How to Start a Niche Newsletter That Can Actually Make Money",
    category: "creator-business",
    angle:
      "Audience selection, publishing cadence, offer design, sponsorships, affiliate links, and quality bar.",
    referenceUrls: []
  },
  {
    id: "newsletter-subject-line-formulas",
    title: "Newsletter Subject Line Formulas for Higher Opens",
    category: "creator-business",
    angle:
      "Useful subject line patterns with examples for news, creator, ecommerce, and B2B newsletters.",
    referenceUrls: []
  },
  {
    id: "beehiiv-vs-substack-for-monetization",
    title: "Beehiiv vs Substack for Monetization: Which Is Better for Creators?",
    category: "creator-business",
    angle:
      "Compare ads, paid subscriptions, referral loops, discovery, ownership, and workflow fit.",
    referenceUrls: []
  },
  {
    id: "how-to-calculate-newsletter-revenue",
    title: "How to Calculate Newsletter Revenue Before You Grow the List",
    category: "creator-business",
    angle:
      "Model revenue from sponsorships, paid subscriptions, affiliate links, list size, open rate, and conversion.",
    referenceUrls: []
  },
  {
    id: "how-to-calculate-adsense-earnings",
    title: "How to Calculate AdSense Earnings From Pageviews, CTR, and RPM",
    category: "creator-business",
    angle:
      "Explain AdSense earnings with formulas, examples, and common forecasting mistakes.",
    referenceUrls: []
  },
  {
    id: "rpm-vs-cpm-explained",
    title: "RPM vs CPM Explained: What Publishers and Creators Need to Know",
    category: "creator-business",
    angle:
      "Clear definitions, examples, formulas, and how each metric affects ad revenue planning.",
    referenceUrls: []
  },
  {
    id: "how-to-use-utm-parameters",
    title: "How to Use UTM Parameters Correctly: A Simple Tracking Guide",
    category: "digital-marketing",
    angle:
      "UTM naming conventions, source/medium/campaign examples, and mistakes that break attribution.",
    referenceUrls: []
  },
  {
    id: "google-analytics-utm-best-practices",
    title: "Google Analytics UTM Best Practices for Campaign Tracking",
    category: "digital-marketing",
    angle:
      "Explain how to structure UTM tags for GA4 reporting across email, paid social, organic, and partners.",
    referenceUrls: []
  },
  {
    id: "best-ai-tools-for-digital-marketing",
    title: "Best AI Tools for Digital Marketing Teams: A Practical Workflow",
    category: "digital-marketing",
    angle:
      "Break down AI tools for campaign planning, copywriting, creative, SEO, analytics, and reporting.",
    referenceUrls: []
  },
  {
    id: "how-to-use-ai-for-facebook-ads",
    title: "How to Use AI for Facebook Ads: Copy, Creative Angles, and Testing",
    category: "digital-marketing",
    angle:
      "Use AI to generate ad angles, variations, hooks, and creative briefs while keeping human testing discipline.",
    referenceUrls: []
  },
  {
    id: "how-to-use-ai-for-google-ads",
    title: "How to Use AI for Google Ads Without Wasting Budget",
    category: "digital-marketing",
    angle:
      "Keyword grouping, ad copy drafts, landing page alignment, and negatives with human review.",
    referenceUrls: []
  },
  {
    id: "ai-for-shopify-product-descriptions",
    title: "How to Use AI for Shopify Product Descriptions That Convert",
    category: "ecommerce",
    angle:
      "Product page structure, benefits, FAQs, SEO terms, brand voice, and review-based copy improvements.",
    referenceUrls: []
  },
  {
    id: "shopify-seo-checklist",
    title: "Shopify SEO Checklist: Product Pages, Collections, and Technical Basics",
    category: "ecommerce",
    angle:
      "Practical SEO checklist for ecommerce stores with product copy, metadata, images, schema, and internal links.",
    referenceUrls: []
  },
  {
    id: "woocommerce-vs-shopify-seo",
    title: "WooCommerce vs Shopify SEO: Which Platform Gives You More Control?",
    category: "ecommerce",
    angle:
      "Compare technical SEO flexibility, apps/plugins, site speed, content management, and operator complexity.",
    referenceUrls: []
  },
  {
    id: "saas-pricing-page-best-practices",
    title: "SaaS Pricing Page Best Practices: How to Structure Plans That Convert",
    category: "startups",
    angle:
      "Pricing page layout, plan naming, feature gating, anchors, FAQs, and simple pricing math.",
    referenceUrls: []
  },
  {
    id: "how-to-price-a-saas-product",
    title: "How to Price a SaaS Product: A Practical Formula for Founders",
    category: "startups",
    angle:
      "Explain value metric, customer segments, margin, willingness to pay, and packaging experiments.",
    referenceUrls: []
  },
  {
    id: "startup-name-ideas-with-ai",
    title: "How to Use AI to Generate Startup Name Ideas Without Sounding Generic",
    category: "startups",
    angle:
      "Naming constraints, domain checks, positioning, memorability, and filtering generated names.",
    referenceUrls: []
  },
  {
    id: "ai-tools-for-startup-founders",
    title: "AI Tools for Startup Founders: What to Use at Each Stage",
    category: "startups",
    angle:
      "Map tools to idea validation, landing pages, coding, customer interviews, support, and fundraising prep.",
    referenceUrls: []
  },
  {
    id: "how-to-use-ai-for-fintech-content",
    title: "How to Use AI for Fintech Content Without Losing Trust",
    category: "fintech",
    angle:
      "Trust, compliance review, disclaimers, fact-checking, and workflows for regulated or financial topics.",
    referenceUrls: []
  },
  {
    id: "stripe-vs-paddle-for-saas",
    title: "Stripe vs Paddle for SaaS: Payments, Tax, and Founder Tradeoffs",
    category: "fintech",
    angle:
      "Compare payments infrastructure, merchant of record, tax handling, checkout control, and operational fit.",
    referenceUrls: ["https://stripe.com", "https://www.paddle.com"]
  },
  {
    id: "how-to-compress-images-for-web",
    title: "How to Compress Images for the Web Without Losing Quality",
    category: "seo",
    angle:
      "Image formats, dimensions, compression, Core Web Vitals, and publishing checklist for non-designers.",
    referenceUrls: []
  },
  {
    id: "robots-txt-for-beginners",
    title: "Robots.txt for Beginners: What It Does and What Not to Block",
    category: "seo",
    angle:
      "Simple explanation of crawl rules, common mistakes, sitemap links, and when not to use robots.txt.",
    referenceUrls: []
  },
  {
    id: "google-search-console-indexing-guide",
    title:
      "Google Search Console Indexing: How Long It Takes and Whether Sitemaps Help",
    category: "seo",
    angle:
      "Explain how Google discovers and indexes new sites and URLs, what URL Inspection and Coverage reports show, typical timelines for brand-new domains vs established sites, the difference between discovered/crawled/indexed, when submitting a sitemap speeds things up vs when it only helps monitoring, and practical checks for new publishers (canonicals, robots, noindex, thin pages). Link to robots.txt generator, sitemap hub, and on-site SEO tools.",
    referenceUrls: [
      "https://search.google.com/search-console",
      "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview"
    ]
  },
  {
    id: "google-analytics-data-delay-and-bots",
    title:
      "Google Analytics Data Delay: Why Reports Lag and What GA4 Does Not Track",
    category: "digital-marketing",
    angle:
      "Explain GA4 processing delay for standard vs realtime reports, intraday data freshness, why numbers change after 24-48 hours, bot and spam filtering behavior, what Google does not count (many crawlers, preview bots, ad blockers, offline events unless configured), sampling and thresholds on high-traffic properties, and how to pair GA4 with Search Console and first-party analytics. Link to UTM builder and site tools where relevant.",
    referenceUrls: [
      "https://support.google.com/analytics/answer/11198161",
      "https://support.google.com/analytics/answer/9304153"
    ]
  },
  {
    id: "how-long-until-site-appears-in-google-search",
    title:
      "How Long Until Your Site Appears in Google Search Results?",
    category: "seo",
    angle:
      "Set realistic expectations for new domains, new blog posts, and tool pages: discovery, crawl budget, indexing vs ranking, first impressions in Search Console, why sitemaps and internal links matter, common blockers (noindex, duplicate content, weak internal linking, manual actions), and a week-by-week checklist for publishers. Compare indexing time vs ranking time clearly.",
    referenceUrls: [
      "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
      "https://search.google.com/search-console"
    ]
  },
  {
    id: "best-seo-tools-for-small-publishers",
    title:
      "Best SEO Tools for Small Publishers: Famous Suites vs Lightweight Options",
    category: "seo",
    angle:
      "Compare the most useful and well-known SEO tools (Semrush, Ahrefs, Moz, Screaming Frog, GSC, GA4) with lighter options and free on-site tools for keyword clustering, SERP intent, content gaps, briefs, titles, and meta descriptions. Explain when to pay for enterprise suites vs when a stack of focused tools and Search Console is enough for solo operators and small media sites. Link to /tools, keyword cluster, SERP intent, content gap, and relevant /compare pages.",
    referenceUrls: [
      "https://search.google.com/search-console",
      "https://analytics.google.com"
    ]
  },
  {
    id: "how-to-create-twitter-card-images",
    title: "How to Create Twitter/X Card Images That Make Links Look Better",
    category: "digital-marketing",
    angle:
      "Social preview basics, dimensions, headline design, brand consistency, and publishing workflow.",
    referenceUrls: []
  }
];

export function editorialSourceUrl(topicId: string) {
  return `editorial://${topicId}`;
}
