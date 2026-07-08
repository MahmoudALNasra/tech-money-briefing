import { getInlineImageBlockIndices } from "@/lib/owner-voice/aeo-content";

export { getInlineImageBlockIndices };

export function mapInlineImagesToBlockIndices(
  contentBlocks: string[],
  imageCount: number
) {
  const indices = getInlineImageBlockIndices(contentBlocks);
  return indices.slice(0, imageCount);
}
