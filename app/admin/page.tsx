import type { Metadata } from "next";

import { AdminGate } from "@/components/admin/AdminGate";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Secure Account Operations",
  description: "Restricted account operations workspace.",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <ToolPageShell
      eyebrow="Restricted workspace"
      title="Account operations"
      description="Manage user credits, transactions, report activity, and refunds from one secure workspace."
      showMonetizationRail={false}
      showAssistant={false}
    >
      <AdminGate />
    </ToolPageShell>
  );
}
