import type { Metadata } from "next";
import { Suspense } from "react";

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
        <Suspense
          fallback={
            <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-emerald-400" />
              <p className="mt-4 text-sm font-bold text-stone-700">
                Finishing sign in...
              </p>
            </div>
          }
        >
          <AuthCallback />
        </Suspense>
      </div>
    </ToolPageShell>
  );
}
