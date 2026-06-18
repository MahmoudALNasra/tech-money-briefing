import type { SocialSourceType } from "@/lib/social-drafts/types";
import { SOCIAL_SOURCE_TYPES } from "@/lib/social-drafts/types";
import { supabase } from "@/lib/supabase";

export function nextSourceType(last: SocialSourceType | null): SocialSourceType {
  if (!last) {
    return SOCIAL_SOURCE_TYPES[0];
  }

  const index = SOCIAL_SOURCE_TYPES.indexOf(last);

  if (index === -1) {
    return SOCIAL_SOURCE_TYPES[0];
  }

  return SOCIAL_SOURCE_TYPES[(index + 1) % SOCIAL_SOURCE_TYPES.length];
}

export async function getLastSocialSourceType(): Promise<SocialSourceType | null> {
  const { data, error } = await supabase
    .from("social_post_drafts")
    .select("source_type")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.source_type) {
    return null;
  }

  const value = String(data.source_type);

  if ((SOCIAL_SOURCE_TYPES as readonly string[]).includes(value)) {
    return value as SocialSourceType;
  }

  return null;
}
