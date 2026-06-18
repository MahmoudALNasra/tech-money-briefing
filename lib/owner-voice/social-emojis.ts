import { getOpenAIClient } from "@/lib/openai";
import { extractOpeningLine } from "@/lib/social-drafts/repetition";
import type { GeneratedSocialDraft } from "@/lib/social-drafts/types";

const SOCIAL_EMOJI_SYSTEM_PROMPT = `You add emojis to social post copy for Tech Revenue Brief.

Rules:
- Keep the same facts, claims, and sentence meaning. Do not rewrite the voice or add new information.
- LinkedIn: add 3-6 emojis woven into the body (hook line, one mid-post, CTA if present). No emoji-only lines.
- Instagram: add 5-8 emojis — a little more expressive than LinkedIn, still professional.
- Use question marks, attention emojis (❓⚠️🔍💡📍🔥✅❌), and topic-relevant emojis where they fit naturally.
- Never use emoji bullet lists, rocket-openers, or hashtag spam blocks.
- Do not remove paragraph breaks on LinkedIn.

Return strict JSON:
{
  "linkedin_draft": string,
  "instagram_caption": string
}`;

function parseEmojiPolishJson(content: string) {
  const parsed = JSON.parse(content) as {
    linkedin_draft?: string;
    instagram_caption?: string;
  };

  const linkedin_draft = String(parsed.linkedin_draft ?? "").trim();
  const instagram_caption = String(parsed.instagram_caption ?? "").trim();

  if (!linkedin_draft || !instagram_caption) {
    throw new Error("Emoji polish returned empty fields.");
  }

  return { linkedin_draft, instagram_caption };
}

export async function applySocialEmojiPolish(input: {
  linkedin_draft: string;
  instagram_caption: string;
  source_type: string;
}): Promise<Pick<GeneratedSocialDraft, "linkedin_draft" | "instagram_caption" | "linkedin_opening" | "instagram_opening">> {
  const openai = getOpenAIClient();
  const model =
    process.env.SOCIAL_EMOJI_MODEL?.trim() ||
    process.env.SOCIAL_OWNER_VOICE_MODEL?.trim() ||
    process.env.SOCIAL_DRAFT_MODEL?.trim() ||
    "gpt-4o-mini";

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.85,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SOCIAL_EMOJI_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Source type: ${input.source_type}

Add emojis to these posts:

LINKEDIN:
${input.linkedin_draft}

INSTAGRAM:
${input.instagram_caption}`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Emoji polish returned empty content.");
  }

  const polished = parseEmojiPolishJson(content);

  return {
    linkedin_draft: polished.linkedin_draft,
    instagram_caption: polished.instagram_caption,
    linkedin_opening: extractOpeningLine(polished.linkedin_draft),
    instagram_opening: extractOpeningLine(polished.instagram_caption)
  };
}
