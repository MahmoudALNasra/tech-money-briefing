"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteScrollProgress } from "@/components/layout/SiteScrollProgress";
import { ReferralNudge } from "@/components/referrals/ReferralNudge";

function isStandalonePath(pathname: string | null) {
  return pathname === "/aseel" || pathname?.startsWith("/aseel/");
}

export function ConditionalSiteChrome({
  showReferralNudge = false
}: {
  showReferralNudge?: boolean;
}) {
  const pathname = usePathname();

  if (isStandalonePath(pathname)) {
    return null;
  }

  return (
    <>
      <SiteScrollProgress />
      {showReferralNudge ? <ReferralNudge /> : null}
      <SiteFooter />
    </>
  );
}

export function ConditionalAnalyticsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isStandalonePath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
