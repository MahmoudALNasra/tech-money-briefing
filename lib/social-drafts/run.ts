import { brandedImageInputFromSocialPayload } from "@/lib/branded-result-image/normalize";
import { applyOwnerVoiceToSocialDraft } from "@/lib/owner-voice/social";
import { applySocialEmojiPolish } from "@/lib/owner-voice/social-emojis";
import {
  encodeBrandedResultImageVariants,
  generateBrandedResultImage
} from "@/lib/branded-result-image/generate";
import type { BrandedResultImageVariants } from "@/lib/branded-result-image/types";
import { sendSocialDraftEmail } from "@/lib/social-drafts/email";
import { generateSocialDraftPair } from "@/lib/social-drafts/generate";
import { getLastSocialSourceType, nextSourceType } from "@/lib/social-drafts/rotation";
import { resolveSocialDraftSource } from "@/lib/social-drafts/sources";
import type { SocialPostDraftRow, SocialSourceType } from "@/lib/social-drafts/types";
import { uploadSocialDraftBrandedImagePair } from "@/lib/social-draft-branded-images";
import { absoluteUrl } from "@/lib/site";
import { safeTrim } from "@/lib/safe-string";
import { supabase } from "@/lib/supabase";

function mapDraftRow(row: Record<string, unknown>): SocialPostDraftRow {
  return {
    id: String(row.id),
    run_label: String(row.run_label ?? "daily"),
    source_type: row.source_type as SocialPostDraftRow["source_type"],
    source_payload: (row.source_payload as Record<string, unknown>) ?? {},
    linkedin_draft: String(row.linkedin_draft ?? ""),
    instagram_caption: String(row.instagram_caption ?? ""),
    instagram_visual_direction: String(row.instagram_visual_direction ?? ""),
    linkedin_opening: String(row.linkedin_opening ?? ""),
    instagram_opening: String(row.instagram_opening ?? ""),
    repetition_warning: row.repetition_warning ? String(row.repetition_warning) : null,
    branded_image_variants: (row.branded_image_variants as BrandedResultImageVariants | null) ?? null,
    posted_linkedin_at: row.posted_linkedin_at ? String(row.posted_linkedin_at) : null,
    posted_instagram_at: row.posted_instagram_at ? String(row.posted_instagram_at) : null,
    email_sent_at: row.email_sent_at ? String(row.email_sent_at) : null,
    created_at: String(row.created_at ?? "")
  };
}

export async function listSocialPostDrafts(limit = 20) {
  const { data, error } = await supabase
    .from("social_post_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => summarizeDraftForList(mapDraftRow(row as Record<string, unknown>)));
}

function summarizeDraftForList(draft: SocialPostDraftRow): SocialPostDraftRow {
  if (!draft.branded_image_variants) {
    return draft;
  }

  const squarePath = draft.branded_image_variants.square.publicPath;
  const landscapePath = draft.branded_image_variants.landscape.publicPath;

  return {
    ...draft,
    branded_image_variants: null,
    has_branded_images: true,
    branded_image_square_url: squarePath ? absoluteUrl(squarePath) : null,
    branded_image_landscape_url: landscapePath ? absoluteUrl(landscapePath) : null
  };
}

export async function markSocialDraftPosted(input: {
  id: string;
  platform: "linkedin" | "instagram";
}) {
  const column =
    input.platform === "linkedin" ? "posted_linkedin_at" : "posted_instagram_at";
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("social_post_drafts")
    .update({ [column]: now })
    .eq("id", input.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Draft not found.");
  }

  return mapDraftRow(data as Record<string, unknown>);
}

export async function runDailySocialDrafts(input?: {
  runLabel?: string;
  forceSourceType?: SocialSourceType;
  skipEmail?: boolean;
  applyOwnerVoice?: boolean;
  applyEmojis?: boolean;
}) {
  const runLabel = input?.runLabel ?? "daily";
  const applyOwnerVoice = input?.applyOwnerVoice !== false;
  const applyEmojis = input?.applyEmojis !== false;
  const lastSourceType = await getLastSocialSourceType();
  const requestedType = input?.forceSourceType ?? nextSourceType(lastSourceType);
  const resolved = await resolveSocialDraftSource(requestedType);
  const source = resolved.source;
  let sourcePayload: Record<string, unknown> =
    resolved.fallback_from != null
      ? {
          ...source.payload,
          _rotation_note: `Planned source "${resolved.fallback_from}" was unavailable; used "${source.type}" instead.`
        }
      : { ...source.payload };
  let generated = await generateSocialDraftPair(source);

  if (applyOwnerVoice) {
    const voiced = await applyOwnerVoiceToSocialDraft({
      linkedin_draft: generated.linkedin_draft,
      instagram_caption: generated.instagram_caption,
      instagram_visual_direction: generated.instagram_visual_direction,
      source_type: source.type,
      source_payload: sourcePayload
    });

    generated = {
      ...generated,
      ...voiced
    };
    sourcePayload = {
      ...sourcePayload,
      _owner_voice_applied_at: new Date().toISOString()
    };
  }

  if (applyEmojis) {
    const emojiPolished = await applySocialEmojiPolish({
      linkedin_draft: generated.linkedin_draft,
      instagram_caption: generated.instagram_caption,
      source_type: source.type
    });

    generated = {
      ...generated,
      ...emojiPolished
    };
    sourcePayload = {
      ...sourcePayload,
      _emoji_polish_applied_at: new Date().toISOString()
    };
  }

  let brandedImageVariants: BrandedResultImageVariants | null = null;
  let brandedImageBuffers: { square: Buffer; landscape: Buffer } | null = null;

  if (source.type === "enrichment_example") {
    const themeSeed = `${safeTrim(sourcePayload.hook_question)}|${Date.now()}`;
    const imageInput = brandedImageInputFromSocialPayload(source.payload, themeSeed);
    sourcePayload = {
      ...sourcePayload,
      _branded_image_theme: imageInput.themeId
    };
    const buffers = await generateBrandedResultImage(imageInput);
    brandedImageBuffers = buffers;
    brandedImageVariants = encodeBrandedResultImageVariants(buffers);
  }

  const { data, error } = await supabase
    .from("social_post_drafts")
    .insert({
      run_label: runLabel,
      source_type: source.type,
      source_payload: sourcePayload,
      linkedin_draft: generated.linkedin_draft,
      instagram_caption: generated.instagram_caption,
      instagram_visual_direction: brandedImageVariants
        ? "Use the attached branded result card image (square for Instagram, landscape for LinkedIn if you prefer)."
        : generated.instagram_visual_direction,
      linkedin_opening: generated.linkedin_opening,
      instagram_opening: generated.instagram_opening,
      repetition_warning: generated.repetition_warning,
      branded_image_variants: brandedImageVariants
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to store social draft.");
  }

  const draft = mapDraftRow(data as Record<string, unknown>);

  if (brandedImageVariants && brandedImageBuffers) {
    try {
      const { squarePath, landscapePath } = await uploadSocialDraftBrandedImagePair({
        draftId: draft.id,
        square: brandedImageBuffers.square,
        landscape: brandedImageBuffers.landscape
      });

      brandedImageVariants = {
        square: { ...brandedImageVariants.square, publicPath: squarePath },
        landscape: { ...brandedImageVariants.landscape, publicPath: landscapePath }
      };

      await supabase
        .from("social_post_drafts")
        .update({ branded_image_variants: brandedImageVariants })
        .eq("id", draft.id);

      draft.branded_image_variants = brandedImageVariants;
    } catch (uploadError) {
      console.error("Failed to upload social draft branded images:", uploadError);
    }
  }

  const emailResult = input?.skipEmail
    ? { sent: false, skipped: true, reason: "skipped" as const }
    : await sendSocialDraftEmail(draft);

  if (emailResult.sent) {
    await supabase
      .from("social_post_drafts")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", draft.id);
  }

  return {
    ok: true,
    draft,
    email: emailResult,
    source_type: source.type,
    requested_source_type: requestedType,
    fallback_from: resolved.fallback_from ?? null
  };
}
