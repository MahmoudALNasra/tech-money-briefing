import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { ToolPageShell } from "@/components/tools/ToolPageShell";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Tech Revenue Brief profile.",
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <ToolPageShell
      eyebrow="Account"
      title="Sign in"
      description="Access your profile, saved business data searches, exports, and future paid tools."
      showMonetizationRail={false}
      showAssistant={false}
      contentMaxWidthClassName="max-w-xl"
      heroMaxWidthClassName="max-w-xl"
    >
      <div className="mx-auto w-full min-w-0">
        <AuthForm mode="login" />
      </div>
    </ToolPageShell>
  );
}
