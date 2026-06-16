"use client";

import dynamic from "next/dynamic";

const TerminalFeed = dynamic(() => import("@/components/home/TerminalFeed"), {
  ssr: false,
  loading: () => (
    <div className="terminal-card terminal-card-loading" aria-hidden="true">
      <div className="terminal-bar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">signal-feed.sh — live briefings</span>
      </div>
      <div className="terminal-body" />
    </div>
  )
});

export function TerminalFeedDynamic() {
  return <TerminalFeed />;
}

