import { getSupabaseClient } from "@/lib/supabase";

const SOCIAL_DRAFT_MEDIA_BUCKET = "social-draft-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type BrandedImageUploadVariant = "square" | "landscape";

export function socialDraftBrandedImageStoragePath(
  draftId: string,
  variant: BrandedImageUploadVariant
) {
  return `${draftId}/${variant}.png`;
}

export function socialDraftBrandedImagePublicPath(
  draftId: string,
  variant: BrandedImageUploadVariant
) {
  return `/media/social-drafts/${socialDraftBrandedImageStoragePath(draftId, variant)}`;
}

async function ensureSocialDraftMediaBucket() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.createBucket(SOCIAL_DRAFT_MEDIA_BUCKET, {
    public: false,
    fileSizeLimit: `${MAX_IMAGE_BYTES}`
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }
}

export async function uploadSocialDraftBrandedImage(input: {
  draftId: string;
  variant: BrandedImageUploadVariant;
  buffer: Buffer;
}) {
  if (input.buffer.length === 0 || input.buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Branded image buffer is empty or too large.");
  }

  const supabase = getSupabaseClient();
  const storagePath = socialDraftBrandedImageStoragePath(input.draftId, input.variant);
  let { error } = await supabase.storage
    .from(SOCIAL_DRAFT_MEDIA_BUCKET)
    .upload(storagePath, input.buffer, {
      contentType: "image/png",
      upsert: true
    });

  if (error && error.message.toLowerCase().includes("bucket not found")) {
    await ensureSocialDraftMediaBucket();
    ({ error } = await supabase.storage
      .from(SOCIAL_DRAFT_MEDIA_BUCKET)
      .upload(storagePath, input.buffer, {
        contentType: "image/png",
        upsert: true
      }));
  }

  if (error) {
    throw new Error(error.message);
  }

  return socialDraftBrandedImagePublicPath(input.draftId, input.variant);
}

export async function uploadSocialDraftBrandedImagePair(input: {
  draftId: string;
  square: Buffer;
  landscape: Buffer;
}) {
  const [squarePath, landscapePath] = await Promise.all([
    uploadSocialDraftBrandedImage({
      draftId: input.draftId,
      variant: "square",
      buffer: input.square
    }),
    uploadSocialDraftBrandedImage({
      draftId: input.draftId,
      variant: "landscape",
      buffer: input.landscape
    })
  ]);

  return { squarePath, landscapePath };
}
