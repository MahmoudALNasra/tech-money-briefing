import {
  OWNER_VOICE_AI_VOCABULARY_AVOID,
  OWNER_VOICE_ANTI_AI_INSTRUCTIONS,
  OWNER_VOICE_REWRITE_GUIDE
} from "@/lib/article-attribution";
import { getOpenAIClient } from "@/lib/openai";
import { extractOpeningLine } from "@/lib/social-drafts/repetition";
import type { GeneratedSocialDraft } from "@/lib/social-drafts/types";

const SOCIAL_OWNER_VOICE_SYSTEM_PROMPT = `You rewrite social post drafts for Tech Revenue Brief into the site's owner voice.

Voice:
- First-person skeptical operator who has actually used tools and done the work
- Short, specific, human — not an ad or press release
- Ground every claim in the source facts provided. Do not invent stats, businesses, or features.
- Vary sentence rhythm. Mix short punchy lines with longer ones.
- LinkedIn: 2-4 short paragraphs max. Instagram caption: roughly 2-6 lines.
- Some posts can end without a hard CTA. When you include one, keep it natural.

Banned phrasing:
- "Are you tired of", "Introducing", "Exciting news", "Game-changer", "game-changer"
- "Here's the thing", "Let's dive in", "In conclusion", "Furthermore", "Moreover"
- "Leverage", "unlock", "streamline", "robust", "seamless", "delve"
- Emoji bullet lists, hashtag spam, rocket emoji openings
- Generic AI transitions and corporate polish

Emojis:
- A separate polish step may add emojis after this rewrite — keep wording clean here; light inline emojis are fine if natural.

Privacy:
- Never name a specific real business from enrichment data.
- Keep business_category_label, business_category_singular, and area_label when present in the source facts.

${JSON.stringify(OWNER_VOICE_AI_VOCABULARY_AVOID, null, 2)}

${OWNER_VOICE_ANTI_AI_INSTRUCTIONS.join("\n")}

${OWNER_VOICE_REWRITE_GUIDE.join("\n")}

Return strict JSON:
{
  "linkedin_draft": string,
  "instagram_caption": string
}`;

function parseSocialOwnerVoiceJson(content: string) {
  const parsed = JSON.parse(content) as {
    linkedin_draft?: string;
    instagram_caption?: string;
  };

  const linkedin_draft = String(parsed.linkedin_draft ?? "").trim();
  const instagram_caption = String(parsed.instagram_caption ?? "").trim();

  if (!linkedin_draft || !instagram_caption) {
    throw new Error("Owner voice social rewrite returned empty fields.");
  }

  return { linkedin_draft, instagram_caption };
}

export async function applyOwnerVoiceToSocialDraft(input: {
  linkedin_draft: string;
  instagram_caption: string;
  instagram_visual_direction: string;
  source_type: string;
  source_payload: Record<string, unknown>;
}): Promise<Pick<GeneratedSocialDraft, "linkedin_draft" | "instagram_caption" | "linkedin_opening" | "instagram_opening">> {
  const openai = getOpenAIClient();
  const model = process.env.SOCIAL_OWNER_VOICE_MODEL?.trim() || process.env.SOCIAL_DRAFT_MODEL?.trim() || "gpt-4o-mini";

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SOCIAL_OWNER_VOICE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Source type: ${input.source_type}

Source facts (do not go beyond these):
${JSON.stringify(input.source_payload, null, 2)}

Draft to rewrite in owner voice:
LINKEDIN:
${input.linkedin_draft}

INSTAGRAM:
${input.instagram_caption}

Keep instagram_visual_direction unchanged in meaning — we only rewrite the two post bodies above.`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Owner voice social rewrite returned empty content.");
  }

  const rewritten = parseSocialOwnerVoiceJson(content);

  return {
    linkedin_draft: rewritten.linkedin_draft,
    instagram_caption: rewritten.instagram_caption,
    linkedin_opening: extractOpeningLine(rewritten.linkedin_draft),
    instagram_opening: extractOpeningLine(rewritten.instagram_caption)
  };
}
