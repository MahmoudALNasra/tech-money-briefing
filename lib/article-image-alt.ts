import { getOpenAIClient } from "@/lib/openai";

export type ImageAltReference = {
  referenceTitle: string;
  sourceName?: string | null;
};

const ALT_MIN = 48;
const ALT_MAX = 125;

const CATEGORY_VISUALS: Record<string, string[]> = {
  "digital-marketing": [
    "Email marketing dashboard with campaign metrics",
    "Marketing automation workflow on a laptop screen",
    "Newsletter performance chart and send schedule"
  ],
  seo: [
    "SEO analytics dashboard with traffic and rankings",
    "Search Console performance report on screen",
    "Keyword research workflow for content planning"
  ],
  "ai-tools": [
    "AI software interface for productivity workflow",
    "Developer using an AI assistant in a code editor",
    "Automation dashboard with AI-generated outputs"
  ],
  startups: [
    "Founder reviewing startup metrics on a laptop",
    "SaaS dashboard with growth and revenue charts",
    "Small team planning product roadmap on screen"
  ],
  fintech: [
    "Fintech app dashboard with payments and balances",
    "Financial analytics chart for business reporting",
    "Mobile banking workflow on a business account"
  ],
  ecommerce: [
    "Ecommerce store admin with orders and inventory",
    "Online checkout and product catalog screenshot",
    "Shop sales dashboard with conversion metrics"
  ],
  "creator-business": [
    "Creator analytics dashboard with audience growth",
    "Content publishing workflow on a creator platform",
    "Newsletter and social performance metrics"
  ],
  others: [
    "Business software dashboard on a computer screen",
    "Operator workflow screenshot for online business",
    "Analytics chart used in a tech briefing"
  ]
};

function clampAlt(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length <= ALT_MAX) {
    return normalized;
  }

  const clipped = normalized.slice(0, ALT_MAX - 1).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");

  return (lastSpace > ALT_MIN ? clipped.slice(0, lastSpace) : clipped).trim();
}

function normalizeTopic(title: string) {
  return title
    .replace(/\s*[|\-–—]\s*.+$/u, "")
    .replace(/\b(20\d{2}|guide|how to|without|sounding generic)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanReferenceTitle(title: string) {
  return title
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(new research|tools|guide|blog|updated|ultimate|complete)\b/gi, "")
    .replace(/\s*[|\-–—:]\s*.+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function heuristicAlt(input: {
  articleTitle: string;
  category: string;
  image: ImageAltReference;
  index: number;
}) {
  const topic = normalizeTopic(input.articleTitle) || input.articleTitle;
  const cleaned = cleanReferenceTitle(input.image.referenceTitle);
  const fallbackVisual =
    CATEGORY_VISUALS[input.category]?.[input.index % 3] ??
    CATEGORY_VISUALS.others[input.index % 3];

  if (cleaned.length >= 24 && cleaned.length <= 90) {
    const lowerCleaned = cleaned.toLowerCase();
    const lowerTopic = topic.toLowerCase();

    if (!lowerTopic.includes(lowerCleaned.slice(0, 20))) {
      return clampAlt(`${cleaned} for ${topic}`);
    }
  }

  return clampAlt(`${fallbackVisual} for ${topic}`);
}

export function buildHeuristicArticleImageAlts(input: {
  articleTitle: string;
  category: string;
  images: ImageAltReference[];
}) {
  return input.images.map((image, index) =>
    heuristicAlt({
      articleTitle: input.articleTitle,
      category: input.category,
      image,
      index
    })
  );
}

export async function buildArticleImageAlts(input: {
  articleTitle: string;
  category: string;
  metaDescription?: string;
  images: ImageAltReference[];
}) {
  if (input.images.length === 0) {
    return [];
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return buildHeuristicArticleImageAlts(input);
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "article_image_alts",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              alts: {
                type: "array",
                minItems: input.images.length,
                maxItems: input.images.length,
                items: { type: "string" }
              }
            },
            required: ["alts"]
          }
        }
      },
      messages: [
        {
          role: "system",
          content:
            "You write HTML img alt text for article images. Be specific, factual, and useful for image SEO and AI search summaries."
        },
        {
          role: "user",
          content: JSON.stringify({
            articleTitle: input.articleTitle,
            category: input.category,
            metaDescription: input.metaDescription ?? "",
            images: input.images,
            rules: [
              "Return exactly one alt string per image, same order as images.",
              "Describe what the image likely shows based on the reference title and article topic.",
              "48-125 characters each.",
              "Include the article topic naturally once per alt when it fits.",
              "No 'image of', 'visual representation', 'infographic illustrating', 'showcasing', or source names.",
              "No brackets, no clickbait, no duplicate alts.",
              "Name the workflow, UI, chart, or scene directly (email dashboard, campaign metrics, automation screen).",
              "Write for humans and search/AI systems that read alt text."
            ]
          })
        }
      ]
    });

    const raw = completion.choices[0]?.message.content;
    if (!raw) {
      throw new Error("Empty alt text response");
    }

    const parsed = JSON.parse(raw) as { alts: string[] };
    return parsed.alts.map((alt, index) => {
      const trimmed = alt.trim();
      return trimmed.length >= ALT_MIN
        ? clampAlt(trimmed)
        : buildHeuristicArticleImageAlts(input)[index];
    });
  } catch {
    return buildHeuristicArticleImageAlts(input);
  }
}
