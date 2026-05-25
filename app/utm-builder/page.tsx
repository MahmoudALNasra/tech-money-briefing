import type { Metadata } from "next";

import { UtmBuilder } from "@/components/tools/ExtendedGenerators";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free UTM Link Builder",
  description: `Build campaign tracking URLs with utm_source, utm_medium, and utm_campaign for free - from ${siteConfig.name}.`,
  keywords: [
    "UTM builder",
    "UTM link generator",
    "campaign URL builder",
    "free UTM tool"
  ],
  robots: { index: true, follow: true }
};

export default function UtmBuilderPage() {
  return (
    <ToolPageShell
      eyebrow="Free marketing tool"
      title="Free UTM link builder"
      description="Build tracking URLs with utm_source, utm_medium, and utm_campaign for campaigns and social posts."
      secondaryCopy="Use consistent naming across campaigns so analytics stays clean in GA4 or your attribution stack."
    >
      <UtmBuilder />
    </ToolPageShell>
  );
}
