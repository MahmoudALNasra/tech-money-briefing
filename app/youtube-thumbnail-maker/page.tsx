import type { Metadata } from "next";

import { SocialImageTool } from "@/components/tools/SocialImageTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free YouTube Thumbnail Maker - Add Text to a Photo",
  description: `Create a YouTube thumbnail online for free. Upload a photo, add bold thumbnail text, customize colors, and download a 1280x720 PNG - from ${siteConfig.name}.`,
  keywords: [
    "free YouTube thumbnail maker",
    "YouTube thumbnail generator",
    "add text to thumbnail",
    "upload photo thumbnail",
    "thumbnail maker",
    "1280x720 thumbnail",
    "download thumbnail PNG"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function YoutubeThumbnailMakerPage() {
  return (
    <ToolPageShell
      eyebrow="Free creator tool"
      title="Free YouTube thumbnail maker"
      description="Upload a background photo, add big clickable text, customize colors, and download a 1280x720 PNG thumbnail."
      secondaryCopy="Good for videos, Shorts covers, blog promos, and quick social graphics."
    >
      <SocialImageTool variant="youtube" />
    </ToolPageShell>
  );
}
