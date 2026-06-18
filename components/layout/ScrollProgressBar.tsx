"use client";

import { useEffect, useRef } from "react";

export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const progressBarEl = barRef.current;

    if (!progressBarEl) {
      return;
    }

    let ticking = false;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      const docH =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(scrollY / docH, 1) : 0;

      progressBarEl.style.width = `${pct * 100}%`;
    };

    const resetScrollState = () => {
      progressBarEl.style.width = "0%";
      updateScrollState();
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;

      window.requestAnimationFrame(() => {
        updateScrollState();
        ticking = false;
      });
    };

    resetScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={barRef} id="progress-bar" aria-hidden="true" />;
}
