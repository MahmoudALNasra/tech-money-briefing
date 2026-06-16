"use client";

import { useEffect, useRef, useState } from "react";

import "./BlurText.css";

type BlurTextProps = {
  text: string;
  delay?: number;
  animateBy?: "words" | "chars";
  direction?: "top" | "bottom";
  threshold?: number;
  className?: string;
};

export default function BlurText({
  text,
  delay = 60,
  animateBy = "words",
  direction = "top",
  threshold = 0.3,
  className
}: BlurTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const parts = animateBy === "chars" ? Array.from(text) : text.split(/(\s+)/);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setActive(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <span ref={ref} className="rb-blur-text" aria-label={text}>
      {parts.map((part, index) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span
            key={`${part}-${index}`}
            className={`rb-blur-part blur-headline-word ${className ?? ""} ${active ? "is-visible" : ""} rb-from-${direction}`}
            style={{ transitionDelay: `${index * delay}ms` }}
          >
            {part}
          </span>
        )
      )}
    </span>
  );
}
