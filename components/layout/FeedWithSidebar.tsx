import type { ReactNode } from "react";

import { SiteSidebar } from "@/components/layout/SiteSidebar";

type FeedWithSidebarProps = {
  children: ReactNode;
  activeCategory?: string;
};

export function FeedWithSidebar({
  children,
  activeCategory
}: FeedWithSidebarProps) {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">{children}</div>
        <aside className="sticky top-24 hidden self-start lg:block">
          <SiteSidebar activeCategory={activeCategory} />
        </aside>
      </div>
    </div>
  );
}
