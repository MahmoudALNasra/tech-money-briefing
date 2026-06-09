import type { Metadata } from "next";

import { ProfilePanel } from "@/components/auth/ProfilePanel";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Tech Revenue Brief profile and business data workspace.",
  robots: { index: false, follow: false }
};

export default function ProfilePage() {
  return (
    <ToolPageShell
      eyebrow="Profile"
      title="Your workspace"
      description="Manage your account, business credits, and saved business data workflows."
      showMonetizationRail={false}
      showAssistant={false}
    >
      <ProfilePanel />
    </ToolPageShell>
  );
}
