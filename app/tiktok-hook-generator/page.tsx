import type { Metadata } from "next";

import { TiktokHookGenerator } from "@/components/tools/ExtendedGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free TikTok Hook Generator",
  description: `Create short-form video hooks and opening lines for TikTok and Reels for free - from ${siteConfig.name}.`,
  keywords: [
    "TikTok hook generator",
    "video hook generator",
    "Reels hook ideas",
    "short form hook generator"
  ],
  robots: { index: true, follow: true }
};

export default function TiktokHookGeneratorPage() {
  return (
    <ToolPageShell
      eyebrow="Free TikTok tool"
      title="Free TikTok hook generator"
      description="Enter a topic and generate scroll-stopping hooks for TikTok, Reels, and short-form video."
      secondaryCopy="Pair a strong hook with a clear payoff in the first three seconds of your video."
    >
      <TiktokHookGenerator />
    </ToolPageShell>
  );
}
