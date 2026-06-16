"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import "./FadeContent.css";

type FadeContentProps = {
  children: ReactNode;
  blur?: boolean;
  duration?: number;
  delay?: number;
  easing?: string;
  threshold?: number;
  initialOpacity?: number;
  className?: string;
};

export default function FadeContent({
  children,
  blur = false,
  duration = 0.45,
  delay = 0,
  easing = "ease-out",
  threshold = 0.15,
  initialOpacity = 0,
  className
}: FadeContentProps) {
  const ref = useRef<HTMLDivElement>(null);
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
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`rb-fade-content ${className ?? ""} ${visible ? "is-visible" : ""}`}
      style={{
        opacity: visible ? 1 : Math.max(initialOpacity, 0.01),
        filter: blur && !visible ? "blur(4px)" : "blur(0)",
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: easing
      }}
    >
      {children}
    </div>
  );
}
