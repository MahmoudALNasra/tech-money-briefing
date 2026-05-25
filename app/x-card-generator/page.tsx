import type { Metadata } from "next";

import { SocialImageTool } from "@/components/tools/SocialImageTools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Twitter/X Card Preview Generator",
  description: `Make a Twitter/X card preview image for free. Add headline text, upload a background photo, customize colors, and download a 1200x628 PNG - from ${siteConfig.name}.`,
  keywords: [
    "Twitter card generator",
    "X card preview generator",
    "social card maker",
    "Open Graph image generator",
    "free social image generator",
    "upload photo add text",
    "1200x628 image"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function XCardGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free social tool"
      title="Free Twitter/X card preview generator"
      description="Create a clean social preview image with headline text, a subtitle, brand colors, and an optional uploaded photo."
      secondaryCopy="Export a 1200x628 PNG for X posts, LinkedIn posts, blog shares, and Open Graph previews."
    >
      <SocialImageTool variant="x-card" />
    </ToolPageShell>
  );
}
