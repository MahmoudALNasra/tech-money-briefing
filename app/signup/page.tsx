import type { Metadata } from "next";
import { Suspense } from "react";

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
      contentMaxWidthClassName="max-w-xl"
      heroMaxWidthClassName="max-w-xl"
    >
      <div className="mx-auto w-full min-w-0">
        <Suspense
          fallback={
            <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-emerald-400" />
              <p className="mt-4 text-sm font-bold text-stone-700">
                Loading account form...
              </p>
            </div>
          }
        >
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </ToolPageShell>
  );
}
