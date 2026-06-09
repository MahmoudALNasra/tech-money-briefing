import type { Metadata } from "next";

import { AuthCallback } from "@/components/auth/AuthCallback";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Finishing Sign In",
  description: "Finishing account sign in.",
  robots: { index: false, follow: false }
};

export default function AuthCallbackPage() {
  return (
    <ToolPageShell
      eyebrow="Account"
      title="Finishing sign in"
      description="We are completing your secure sign-in and redirecting you back to your workspace."
      showMonetizationRail={false}
      showAssistant={false}
    >
      <div className="mx-auto max-w-xl">
        <AuthCallback />
      </div>
    </ToolPageShell>
  );
}
