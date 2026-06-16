"use client";

import { useEffect, useState } from "react";

type CountUpProps = {
  to: number;
  duration?: number;
  startWhen?: boolean;
  separator?: string;
  className?: string;
};

export default function CountUp({
  to,
  duration = 1,
  startWhen = true,
  separator = "",
  className
}: CountUpProps) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (!startWhen) {
      setValue(to);
      return undefined;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || to === 0) {
      setValue(to);
      return undefined;
    }

    let frame = 0;
    const totalFrames = Math.max(1, Math.round(duration * 60));
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));

      if (progress >= 1) {
        window.clearInterval(timer);
      }
    }, 1000 / 60);

    return () => window.clearInterval(timer);
  }, [duration, startWhen, to]);

  return <span className={className}>{value.toLocaleString("en-US").replace(/,/g, separator)}</span>;
}
