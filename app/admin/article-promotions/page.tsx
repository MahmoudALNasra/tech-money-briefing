import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { ArticlePromotionsPanel } from "@/components/admin/ArticlePromotionsPanel";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Article Social Promotions",
  description:
    "Track Instagram and LinkedIn posts for published articles and copy backlink-ready captions.",
  robots: { index: false, follow: false }
};

export default function AdminArticlePromotionsPage() {
  return (
    <ToolPageShell
      eyebrow="Restricted workspace"
      title="Article social promotions"
      description="Browse every published article by category, copy LinkedIn and Instagram post bodies with backlinks, and mark what you have already posted."
      showMonetizationRail={false}
      showAssistant={false}
    >
      <AdminGate>
        <ArticlePromotionsPanel />
      </AdminGate>
    </ToolPageShell>
  );
}
