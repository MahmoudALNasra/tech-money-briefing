import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Tech Revenue Brief profile.",
  robots: { index: false, follow: false }
};

export default function SignupPage() {
  return (
    <ToolPageShell
      eyebrow="Account"
      title="Create your account"
      description="Create a profile for saved business data searches, exports, and future paid workspace features."
      showMonetizationRail={false}
      showAssistant={false}
    >
      <div className="mx-auto max-w-xl">
        <AuthForm mode="signup" />
      </div>
    </ToolPageShell>
  );
}
