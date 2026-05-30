import { getOpenAIClient } from "./openai";
import {
  formatInternalLinksMarkdown,
  getStaticInternalLinksForText
} from "./internal-links";
import { runKeywordResearch } from "./keyword-research";

export type GscArticleRow = {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  key_takeaways: string[] | null;
  category: string;
};

export type GscImprovedArticle = {
  title: string;
  meta_description: string;
  content: string;
  key_takeaways: string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertSection(content: string, heading: string, body: string) {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return content;
  }

  const section = `## ${heading}\n\n${trimmedBody}`;
  const pattern = new RegExp(
    `^##\\s+${escapeRegExp(heading)}\\b[\\s\\S]*?(?=^##\\s+|\\Z)`,
    "im"
  );

  if (pattern.test(content)) {
    return content.replace(pattern, section);
  }

  const firstHeading = content.search(/^##\s+/m);
  if (firstHeading > 0) {
    return `${content.slice(0, firstHeading).trimEnd()}\n\n${section}\n\n${content.slice(firstHeading).trimStart()}`;
  }

  return `${content.trimEnd()}\n\n${section}`;
}

function mergeConservativeContent(
  original: string,
  quickAnswer: string,
  faqSection: string
) {
  let content = original;
  content = upsertSection(content, "Quick Answer", quickAnswer);
  content = upsertSection(content, "FAQ", faqSection);
  return content;
}

export async function improvePublishedArticleForGsc(
  article: GscArticleRow,
  gscQuery: string
): Promise<GscImprovedArticle> {
  const keywordPlan = await runKeywordResearch({
    seed: gscQuery,
    category: article.category,
    hints: {
      brand: "Tech Revenue Brief",
      isReferral: false
    }
  });

  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.25,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "gsc_article_seo_conservative",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            meta_description: { type: "string" },
            quick_answer: { type: "string" },
            faq_section: { type: "string" },
            key_takeaways: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string" }
            }
          },
          required: [
            "title",
            "meta_description",
            "quick_answer",
            "faq_section",
            "key_takeaways"
          ]
        }
      }
    },
    messages: [
      {
        role: "system",
        content:
          "You improve published articles using real Google Search Console query data. Return only valid JSON. Preserve factual meaning. Do not invent facts."
      },
      {
        role: "user",
        content: JSON.stringify({
          gscQuery,
          keywordPlan,
          instructions: [
            "Align title and meta_description with the GSC query search intent without keyword stuffing.",
            "Return quick_answer and faq_section as markdown body only (no ## heading lines).",
            "FAQ should include 3-4 questions; at least one question should closely match the GSC query.",
            "Use **bold** and ==highlighted phrases== in quick_answer and faq_section where helpful.",
            "Do not rewrite the full article body; sections are merged server-side.",
            "meta_description must be 120-155 characters.",
            "Generate exactly 3 key_takeaways."
          ],
          suggestedInternalLinks: getStaticInternalLinksForText(
            [gscQuery, article.title, article.category].join(" "),
            4
          ),
          current: {
            title: article.title,
            meta_description: article.meta_description,
            key_takeaways: article.key_takeaways ?? [],
            content: article.content.slice(0, 6000)
          }
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    throw new Error("OpenAI returned an empty GSC SEO improvement response");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  let content = mergeConservativeContent(
    article.content,
    String(parsed.quick_answer ?? ""),
    String(parsed.faq_section ?? "")
  );

  const internalBlock = formatInternalLinksMarkdown(
    getStaticInternalLinksForText(
      [String(parsed.title ?? article.title), gscQuery].join(" "),
      2
    )
  );

  if (internalBlock && !content.includes(internalBlock.split("\n")[0] ?? "")) {
    content = `${content}\n\n${internalBlock}`;
  }

  return {
    title: String(parsed.title ?? "").trim() || article.title,
    meta_description:
      String(parsed.meta_description ?? "").trim() || article.meta_description,
    content,
    key_takeaways: Array.isArray(parsed.key_takeaways)
      ? parsed.key_takeaways.map((v) => String(v).trim()).filter(Boolean).slice(0, 3)
      : (article.key_takeaways ?? []).slice(0, 3)
  };
}
