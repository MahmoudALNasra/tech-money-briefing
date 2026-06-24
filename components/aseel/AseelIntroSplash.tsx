"use client";

import { useEffect, useState } from "react";

type AseelIntroSplashProps = {
  caption: string;
  onDone: () => void;
};

const FLOATERS = ["✨", "💜", "👋", "🎀", "⭐", "😌", "💫", "🫶"];

export function AseelIntroSplash({ caption, onDone }: AseelIntroSplashProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(onDone, 450);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      aria-label="Skip intro"
      onClick={() => {
        setLeaving(true);
        window.setTimeout(onDone, 200);
      }}
      className={`aseel-intro fixed inset-0 z-50 flex items-center justify-center bg-[#120818] transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATERS.map((emoji, index) => (
          <span
            key={`${emoji}-${index}`}
            className="aseel-intro-float absolute text-2xl sm:text-3xl"
            style={{
              left: `${8 + (index * 11) % 84}%`,
              top: `${10 + (index * 17) % 72}%`,
              animationDelay: `${index * 0.12}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative px-6 text-center">
        <p className="aseel-intro-pop text-sm font-semibold uppercase tracking-[0.4em] text-fuchsia-300/90">
          yalla
        </p>
        <h2 className="aseel-intro-pop aseel-intro-pop-delay mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
          ركن أسيل
        </h2>
        <p className="aseel-intro-pop aseel-intro-pop-delay-2 mt-5 max-w-sm text-lg leading-8 text-white/75">
          {caption}
        </p>
        <p className="aseel-intro-pop aseel-intro-pop-delay-3 mt-8 text-xs text-white/35">
          tap anywhere to skip
        </p>
      </div>
    </button>
  );
}
