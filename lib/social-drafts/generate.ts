import { getOpenAIClient } from "@/lib/openai";
import {
  buildSocialDraftUserPrompt,
  SOCIAL_DRAFT_SYSTEM_PROMPT
} from "@/lib/social-drafts/prompt";
import {
  detectRepetitionWarning,
  extractOpeningLine
} from "@/lib/social-drafts/repetition";
import type { GeneratedSocialDraft, SocialDraftSource } from "@/lib/social-drafts/types";
import { supabase } from "@/lib/supabase";

type RecentOpenings = {
  linkedin: string[];
  instagram: string[];
};

async function getRecentOpenings(limit = 5): Promise<RecentOpenings> {
  const { data, error } = await supabase
    .from("social_post_drafts")
    .select("linkedin_opening, instagram_opening")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return { linkedin: [], instagram: [] };
  }

  return {
    linkedin: data.map((row) => String(row.linkedin_opening ?? "")).filter(Boolean),
    instagram: data.map((row) => String(row.instagram_opening ?? "")).filter(Boolean)
  };
}

function parseModelJson(content: string) {
  const parsed = JSON.parse(content) as {
    linkedin_draft?: string;
    instagram_caption?: string;
    instagram_visual_direction?: string;
  };

  const linkedin_draft = String(parsed.linkedin_draft ?? "").trim();
  const instagram_caption = String(parsed.instagram_caption ?? "").trim();
  const instagram_visual_direction = String(parsed.instagram_visual_direction ?? "").trim();

  if (!linkedin_draft || !instagram_caption || !instagram_visual_direction) {
    throw new Error("Social draft model response missing required fields.");
  }

  return {
    linkedin_draft,
    instagram_caption,
    instagram_visual_direction
  };
}

async function callSocialDraftModel(input: {
  source: SocialDraftSource;
  recent: RecentOpenings;
  repetition_retry?: boolean;
}) {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: process.env.SOCIAL_DRAFT_MODEL?.trim() || "gpt-4o-mini",
    temperature: 0.95,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SOCIAL_DRAFT_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildSocialDraftUserPrompt({
          source: input.source,
          recent_linkedin_openings: input.recent.linkedin,
          recent_instagram_openings: input.recent.instagram,
          repetition_retry: input.repetition_retry
        })
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Social draft model returned empty content.");
  }

  return parseModelJson(content);
}

export async function generateSocialDraftPair(
  source: SocialDraftSource
): Promise<GeneratedSocialDraft> {
  const recent = await getRecentOpenings();
  let draft = await callSocialDraftModel({ source, recent });

  let linkedin_opening = extractOpeningLine(draft.linkedin_draft);
  let instagram_opening = extractOpeningLine(draft.instagram_caption);
  let repetition_warning = detectRepetitionWarning({
    linkedin_opening,
    instagram_opening,
    recent_linkedin_openings: recent.linkedin,
    recent_instagram_openings: recent.instagram
  });

  if (repetition_warning) {
    draft = await callSocialDraftModel({
      source,
      recent,
      repetition_retry: true
    });

    linkedin_opening = extractOpeningLine(draft.linkedin_draft);
    instagram_opening = extractOpeningLine(draft.instagram_caption);
    repetition_warning = detectRepetitionWarning({
      linkedin_opening,
      instagram_opening,
      recent_linkedin_openings: recent.linkedin,
      recent_instagram_openings: recent.instagram
    });
  }

  return {
    ...draft,
    linkedin_opening,
    instagram_opening,
    repetition_warning
  };
}
