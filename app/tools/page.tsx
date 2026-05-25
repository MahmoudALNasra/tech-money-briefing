import type { Metadata } from "next";
import Link from "next/link";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { FREE_TOOLS } from "@/lib/free-tools";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Tools for Creators, Publishers, and Marketers",
  description: `Free online tools from ${siteConfig.name}: meme generator, image compressor, thumbnail maker, AdSense calculator, CPM calculator, headline generator, and more.`,
  keywords: [
    "free online tools",
    "free meme generator",
    "AdSense calculator",
    "CPM calculator",
    "image compressor",
    "thumbnail maker",
    "headline generator"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function ToolsPage() {
  return (
    <ToolPageShell
      eyebrow="Free tools"
      title="Free tools for creators, publishers, and marketers"
      description="Use these lightweight calculators, generators, and image tools to make content faster and estimate revenue more clearly."
      secondaryCopy="Each tool runs in your browser and has its own indexable page."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FREE_TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md"
          >
            <ToolThumbnail tool={tool} />
            <div className="p-5">
              <h2 className="text-lg font-black text-ink">{tool.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-ink">
                Open tool
              </span>
            </div>
          </Link>
        ))}
      </div>
    </ToolPageShell>
  );
}

function ToolThumbnail({ tool }: { tool: (typeof FREE_TOOLS)[number] }) {
  const pattern = tool.thumbnail.pattern;

  return (
    <div
      className={`relative h-36 overflow-hidden bg-gradient-to-br ${tool.thumbnail.accent}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.18)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.18)_75%,transparent_75%,transparent)] bg-[length:100%_100%,28px_28px]" />
      <div className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white backdrop-blur">
        {tool.thumbnail.label}
      </div>
      {pattern === "caption" ? <CaptionPattern /> : null}
      {pattern === "image" ? <ImagePattern /> : null}
      {pattern === "video" ? <VideoPattern /> : null}
      {pattern === "card" ? <CardPattern /> : null}
      {pattern === "spark" ? <SparkPattern /> : null}
      {pattern === "chart" ? <ChartPattern /> : null}
      {pattern === "mail" ? <MailPattern /> : null}
      {pattern === "lines" ? <LinesPattern /> : null}
      {pattern === "money" ? <MoneyPattern /> : null}
    </div>
  );
}

function CaptionPattern() {
  return (
    <div className="absolute inset-x-6 bottom-5 rounded-xl bg-black/45 p-3 text-center text-white shadow-lg">
      <div className="text-xl font-black">TOP TEXT</div>
      <div className="mt-2 h-2 rounded-full bg-white/70" />
      <div className="mt-2 text-xl font-black">BOTTOM TEXT</div>
    </div>
  );
}

function ImagePattern() {
  return (
    <div className="absolute bottom-5 right-6 h-24 w-28 rounded-2xl border-4 border-white/80 bg-white/25 shadow-lg">
      <div className="absolute bottom-3 left-3 h-8 w-16 rounded-t-full bg-white/70" />
      <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-white/80" />
    </div>
  );
}

function VideoPattern() {
  return (
    <div className="absolute bottom-5 right-6 h-20 w-32 rounded-xl bg-black/45 shadow-lg">
      <div className="absolute left-11 top-5 h-0 w-0 border-y-[18px] border-l-[28px] border-y-transparent border-l-white" />
    </div>
  );
}

function CardPattern() {
  return (
    <div className="absolute bottom-5 left-6 right-6 rounded-xl bg-white/20 p-4 shadow-lg backdrop-blur">
      <div className="h-3 w-3/4 rounded-full bg-white/90" />
      <div className="mt-3 h-2 w-full rounded-full bg-white/60" />
      <div className="mt-2 h-2 w-2/3 rounded-full bg-white/60" />
    </div>
  );
}

function SparkPattern() {
  return (
    <div className="absolute bottom-7 left-8 right-8 grid grid-cols-3 gap-3">
      {["Nova", "Stack", "Pilot"].map((name) => (
        <div key={name} className="rounded-xl bg-white/20 px-3 py-2 text-center text-sm font-black text-white shadow-lg backdrop-blur">
          {name}
        </div>
      ))}
    </div>
  );
}

function ChartPattern() {
  return (
    <div className="absolute bottom-5 left-6 flex h-24 items-end gap-3">
      {[42, 68, 54, 90, 118].map((height) => (
        <div key={height} className="w-8 rounded-t-lg bg-white/80" style={{ height }} />
      ))}
    </div>
  );
}

function MailPattern() {
  return (
    <div className="absolute bottom-5 right-6 h-24 w-32 rounded-2xl bg-white/85 shadow-lg">
      <div className="absolute left-0 right-0 top-0 h-full rounded-2xl [clip-path:polygon(0_0,50%_52%,100%_0,100%_100%,0_100%)] bg-white/40" />
      <div className="absolute left-5 top-8 h-2 w-20 rounded-full bg-slate-700/60" />
      <div className="absolute left-5 top-12 h-2 w-14 rounded-full bg-slate-700/40" />
    </div>
  );
}

function LinesPattern() {
  return (
    <div className="absolute bottom-6 left-6 right-6 space-y-3">
      {[92, 72, 84, 56].map((width) => (
        <div key={width} className="h-3 rounded-full bg-white/80" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

function MoneyPattern() {
  return (
    <div className="absolute bottom-6 right-6 rounded-2xl bg-white/20 px-6 py-4 text-right text-white shadow-lg backdrop-blur">
      <div className="text-4xl font-black">$1,240</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-white/75">
        estimate
      </div>
    </div>
  );
}
