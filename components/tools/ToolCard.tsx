import Link from "next/link";

import { FREE_TOOLS } from "@/lib/free-tools";

type Tool = (typeof FREE_TOOLS)[number];

type ToolCardProps = {
  tool: Tool;
  featured?: boolean;
  compact?: boolean;
};

export function ToolCard({ tool, featured = false, compact = false }: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      className={`group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-stone-400 hover:shadow-xl ${
        featured ? "grid md:grid-cols-[1.05fr_0.95fr]" : ""
      }`}
    >
      <ToolThumbnail tool={tool} compact={compact} featured={featured} />
      <div className={compact ? "p-4" : featured ? "flex flex-col justify-center p-7" : "p-5"}>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-stone-500">
            Free tool
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-300 transition group-hover:text-stone-500">
            Open
          </span>
        </div>
        <h2
          className={`mt-4 font-black leading-tight tracking-tight text-ink ${
            featured ? "text-3xl" : compact ? "text-base" : "text-xl"
          }`}
        >
          {tool.title}
        </h2>
        <p className={`mt-2 leading-6 text-stone-600 ${compact ? "text-sm" : "text-sm"}`}>
          {tool.description}
        </p>
        {!compact ? (
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-stone-400 transition group-hover:text-ink">
            Launch tool
            <span aria-hidden="true" className="transition group-hover:translate-x-1">
              -&gt;
            </span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function ToolThumbnail({
  tool,
  compact = false,
  featured = false
}: {
  tool: Tool;
  compact?: boolean;
  featured?: boolean;
}) {
  const pattern = tool.thumbnail.pattern;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${tool.thumbnail.accent} ${
        featured ? "min-h-72" : compact ? "h-28" : "h-40"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.5),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.22),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.18)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.18)_75%,transparent_75%,transparent)] bg-[length:100%_100%,100%_100%,30px_30px]" />
      <div className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-white shadow-sm backdrop-blur">
        {tool.thumbnail.label}
      </div>
      <div className="absolute right-4 top-4 h-10 w-10 rounded-2xl bg-white/20 shadow-sm backdrop-blur transition group-hover:scale-110">
        <div className="absolute inset-2 rounded-xl bg-white/35" />
      </div>
      {pattern === "caption" ? <CaptionPattern compact={compact} /> : null}
      {pattern === "image" ? <ImagePattern compact={compact} /> : null}
      {pattern === "video" ? <VideoPattern compact={compact} /> : null}
      {pattern === "card" ? <CardPattern compact={compact} /> : null}
      {pattern === "spark" ? <SparkPattern compact={compact} /> : null}
      {pattern === "chart" ? <ChartPattern compact={compact} /> : null}
      {pattern === "mail" ? <MailPattern compact={compact} /> : null}
      {pattern === "lines" ? <LinesPattern compact={compact} /> : null}
      {pattern === "money" ? <MoneyPattern compact={compact} /> : null}
    </div>
  );
}

function CaptionPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute inset-x-6 rounded-xl bg-black/45 p-3 text-center text-white shadow-lg ${compact ? "bottom-3" : "bottom-5"}`}>
      <div className={compact ? "text-sm font-black" : "text-xl font-black"}>TOP TEXT</div>
      <div className="mt-2 h-2 rounded-full bg-white/70" />
      <div className={compact ? "mt-2 text-sm font-black" : "mt-2 text-xl font-black"}>BOTTOM TEXT</div>
    </div>
  );
}

function ImagePattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute bottom-5 right-6 rounded-2xl border-4 border-white/80 bg-white/25 shadow-lg ${compact ? "h-16 w-20" : "h-24 w-28"}`}>
      <div className="absolute bottom-3 left-3 h-8 w-16 rounded-t-full bg-white/70" />
      <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-white/80" />
    </div>
  );
}

function VideoPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute bottom-5 right-6 rounded-xl bg-black/45 shadow-lg ${compact ? "h-14 w-24" : "h-20 w-32"}`}>
      <div className={`absolute h-0 w-0 border-y-transparent border-l-white ${compact ? "left-9 top-4 border-y-[12px] border-l-[20px]" : "left-11 top-5 border-y-[18px] border-l-[28px]"}`} />
    </div>
  );
}

function CardPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute bottom-5 left-6 right-6 rounded-xl bg-white/20 shadow-lg backdrop-blur ${compact ? "p-3" : "p-4"}`}>
      <div className="h-3 w-3/4 rounded-full bg-white/90" />
      <div className="mt-3 h-2 w-full rounded-full bg-white/60" />
      <div className="mt-2 h-2 w-2/3 rounded-full bg-white/60" />
    </div>
  );
}

function SparkPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute left-8 right-8 grid grid-cols-3 gap-3 ${compact ? "bottom-4" : "bottom-7"}`}>
      {["Hook", "Post", "Win"].map((name) => (
        <div key={name} className="rounded-xl bg-white/20 px-3 py-2 text-center text-sm font-black text-white shadow-lg backdrop-blur">
          {name}
        </div>
      ))}
    </div>
  );
}

function ChartPattern({ compact }: { compact: boolean }) {
  const bars = compact ? [36, 54, 42, 68, 84] : [42, 68, 54, 90, 118];

  return (
    <div className="absolute bottom-5 left-6 flex h-24 items-end gap-3">
      {bars.map((height) => (
        <div key={height} className="w-8 rounded-t-lg bg-white/80 shadow-sm" style={{ height }} />
      ))}
    </div>
  );
}

function MailPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute bottom-5 right-6 rounded-2xl bg-white/85 shadow-lg ${compact ? "h-16 w-24" : "h-24 w-32"}`}>
      <div className="absolute left-0 right-0 top-0 h-full rounded-2xl [clip-path:polygon(0_0,50%_52%,100%_0,100%_100%,0_100%)] bg-white/40" />
      <div className="absolute left-5 top-8 h-2 w-20 rounded-full bg-slate-700/60" />
      <div className="absolute left-5 top-12 h-2 w-14 rounded-full bg-slate-700/40" />
    </div>
  );
}

function LinesPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute left-6 right-6 space-y-3 ${compact ? "bottom-5" : "bottom-6"}`}>
      {[92, 72, 84, 56].map((width) => (
        <div key={width} className="h-3 rounded-full bg-white/80 shadow-sm" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

function MoneyPattern({ compact }: { compact: boolean }) {
  return (
    <div className={`absolute bottom-6 right-6 rounded-2xl bg-white/20 text-right text-white shadow-lg backdrop-blur ${compact ? "px-4 py-3" : "px-6 py-4"}`}>
      <div className={compact ? "text-2xl font-black" : "text-4xl font-black"}>$1,240</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-white/75">
        estimate
      </div>
    </div>
  );
}
