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
  }
];

export function editorialSourceUrl(topicId: string) {
  return `editorial://${topicId}`;
}
