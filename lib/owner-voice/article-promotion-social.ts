import {
  OWNER_VOICE_AI_VOCABULARY_AVOID,
  OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
  OWNER_VOICE_REWRITE_GUIDE
} from "@/lib/article-attribution";
import type { ArticlePromotionRow } from "@/lib/article-promotions";
import { formatCategory } from "@/lib/format";
import { getOpenAIClient } from "@/lib/openai";
import {
  detectSocialCopyIssues,
  scanSocialAiSignals
} from "@/lib/owner-voice/social-ai-signals";

const ARTICLE_PROMOTION_SOCIAL_SYSTEM_PROMPT = `You write LinkedIn and Instagram posts promoting a Tech Revenue Brief article.

Voice:
- Skeptical operator who read the briefing — plain, specific, uneven rhythm
- First person only when it adds judgment; not every sentence
- NOT a marketer, press release, or thought-leadership broetry

LinkedIn (2-3 short paragraphs):
- Do NOT open by repeating the article title verbatim
- Mix sentence lengths: include at least one sentence under 8 words
- Name one concrete detail from the source facts (tool, number, name, workflow)
- End with the article URL on its own line — copy the exact url from source facts

Instagram (3-5 short lines before URL):
- Tighter than LinkedIn. No hashtag block — hashtags are added separately
- Max 3 emojis total, woven in naturally — never an emoji-only opener
- Include the article URL on the last line before any hashtags would go

Hard bans (AI detectors flag these):
- "Most don't", "I've seen this play out", "Check out the insights"
- "crucial", "key is", "integrating", "from the onset", "headache for many"
- "insights from", "gauge success", "plays out", "missed tracking opportunities"
- "Furthermore", "Moreover", "Here's the thing", "Let's dive in"
- "leverage", "unlock", "streamline", "robust", "game-changer", "navigating the"
- Rhetorical "Why?" followed by emoji
- Generic enterprise filler that could apply to any AI ROI article

${JSON.stringify(OWNER_VOICE_AI_VOCABULARY_AVOID, null, 2)}

${OWNER_VOICE_ANTI_AI_INSTRUCTIONS.join("\n")}

${OWNER_VOICE_REWRITE_GUIDE.slice(0, 8).join("\n")}

Return strict JSON:
{
  "linkedin_draft": string,
  "instagram_caption": string
}`;

function parsePromotionSocialJson(content: string) {
  const parsed = JSON.parse(content) as {
    linkedin_draft?: string;
    instagram_caption?: string;
  };

  const linkedin_draft = String(parsed.linkedin_draft ?? "").trim();
  const instagram_caption = String(parsed.instagram_caption ?? "").trim();

  if (!linkedin_draft || !instagram_caption) {
    throw new Error("Article promotion social rewrite returned empty fields.");
  }

  return { linkedin_draft, instagram_caption };
}

function buildSourceFacts(article: ArticlePromotionRow, keywords: string[]) {
  return {
    title: article.title,
    url: article.url,
    meta_description: article.meta_description,
    key_takeaways: article.key_takeaways,
    category: article.category,
    category_label: formatCategory(article.category),
    seo_keywords: keywords,
    promotion_goal:
      "Drive backlinks. Sound like a person sharing one sharp takeaway from a briefing they read — not promoting content."
  };
}

async function generatePromotionSocialCopy(input: {
  article: ArticlePromotionRow;
  keywords: string[];
  temperature: number;
  repairIssues?: string[];
}) {
  const openai = getOpenAIClient();
  const model =
    process.env.ARTICLE_PROMOTION_SOCIAL_MODEL?.trim() ||
    process.env.SOCIAL_OWNER_VOICE_MODEL?.trim() ||
    process.env.SOCIAL_DRAFT_MODEL?.trim() ||
    "gpt-4o-mini";

  const repairNote = input.repairIssues?.length
    ? `\n\nFix these issues from the prior draft:\n- ${input.repairIssues.join("\n- ")}`
    : "";

  const response = await openai.chat.completions.create({
    model,
    temperature: input.temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ARTICLE_PROMOTION_SOCIAL_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Source facts only — do not invent stats or quotes:
${JSON.stringify(buildSourceFacts(input.article, input.keywords), null, 2)}${repairNote}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Article promotion social rewrite returned empty content.");
  }

  return parsePromotionSocialJson(content);
}

export async function applyArticlePromotionSocialCopy(input: {
  article: ArticlePromotionRow;
  keywords: string[];
}) {
  const temperatures = [0.88, 0.72, 0.58];
  let lastIssues: string[] = [];
  let lastDraft: { linkedin_draft: string; instagram_caption: string } | null = null;

  for (let attempt = 0; attempt < temperatures.length; attempt += 1) {
    const draft = await generatePromotionSocialCopy({
      article: input.article,
      keywords: input.keywords,
      temperature: temperatures[attempt]!,
      repairIssues: attempt > 0 ? lastIssues : undefined
    });

    lastDraft = draft;
    const issues = detectSocialCopyIssues({
      linkedin: draft.linkedin_draft,
      instagram: draft.instagram_caption
    });

    if (issues.length === 0) {
      return draft;
    }

    lastIssues = issues;
    console.warn(
      `[article-promotion-social] ${input.article.slug} attempt ${attempt + 1}: ${issues.join("; ")}`
    );
  }

  if (lastDraft && lastIssues.length > 0) {
    const signals = scanSocialAiSignals(
      lastDraft.linkedin_draft,
      lastDraft.instagram_caption
    );
    if (signals.length <= 2) {
      return lastDraft;
    }
  }

  throw new Error(
    `Article promotion social copy failed quality checks: ${lastIssues.join("; ")}`
  );
}
