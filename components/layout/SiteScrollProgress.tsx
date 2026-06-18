"use client";

import { usePathname } from "next/navigation";

import { ScrollProgressBar } from "@/components/layout/ScrollProgressBar";

export function SiteScrollProgress() {
  const pathname = usePathname();

  if (pathname === "/leads" || pathname.startsWith("/leads/")) {
    return null;
  }

  return <ScrollProgressBar key={pathname} />;
}
