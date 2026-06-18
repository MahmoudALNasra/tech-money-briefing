import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { SocialDraftsPanel } from "@/components/admin/SocialDraftsPanel";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Social Drafts",
  description: "Review daily LinkedIn and Instagram drafts for /leads before manual posting.",
  robots: { index: false, follow: false }
};

export default function AdminSocialDraftsPage() {
  return (
    <ToolPageShell
      eyebrow="Restricted workspace"
      title="Social drafts"
      description="Daily LinkedIn and Instagram drafts grounded in real /leads data. Review, edit, attach a screenshot, and post manually."
      showMonetizationRail={false}
      showAssistant={false}
    >
      <AdminGate>
        <SocialDraftsPanel />
      </AdminGate>
    </ToolPageShell>
  );
}
