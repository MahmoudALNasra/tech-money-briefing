"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import "./ScrollReveal.css";

type ScrollRevealProps = {
  children: ReactNode;
  containerClassName?: string;
  textClassName?: string;
  baseOpacity?: number;
  enableBlur?: boolean;
  baseBlur?: number;
};

export default function ScrollReveal({
  children,
  containerClassName,
  textClassName,
  baseOpacity = 0,
  enableBlur = true,
  baseBlur = 4
}: ScrollRevealProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const text = String(children);

  return (
    <h3 ref={ref} className={containerClassName}>
      {text.split(/(\s+)/).map((word, index) =>
        /^\s+$/.test(word) ? (
          word
        ) : (
          <span
            key={`${word}-${index}`}
            className={`rb-scroll-word ${textClassName ?? ""} ${visible ? "is-visible" : ""}`}
            style={{
              opacity: visible ? 1 : baseOpacity || 0.01,
              filter: visible || !enableBlur ? "blur(0)" : `blur(${baseBlur}px)`,
              transitionDelay: `${index * 45}ms`
            }}
          >
            {word}
          </span>
        )
      )}
    </h3>
  );
}
