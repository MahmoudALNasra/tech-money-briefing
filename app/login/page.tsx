import type { Metadata } from "next";
import { Suspense } from "react";

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
        <Suspense
          fallback={
            <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-emerald-400" />
              <p className="mt-4 text-sm font-bold text-stone-700">
                Loading sign in...
              </p>
            </div>
          }
        >
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </ToolPageShell>
  );
}
