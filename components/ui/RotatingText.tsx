"use client";

import { useEffect, useMemo, useState } from "react";

import "./RotatingText.css";

type RotatingTextProps = {
  texts: string[];
  interval?: number;
  mainClassName?: string;
  elementLevelClassName?: string;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "word" | "chars";
};

export default function RotatingText({
  texts,
  interval = 2800,
  mainClassName,
  elementLevelClassName,
  loop = true,
  auto = true
}: RotatingTextProps) {
  const safeTexts = useMemo(
    () => (texts.length >= 3 ? texts : ["intelligence", "leads", "signal", "briefs", "revenue"]),
    [texts]
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!auto || safeTexts.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => {
          const next = current + 1;
          return next >= safeTexts.length ? (loop ? 0 : current) : next;
        });
        setVisible(true);
      }, 320);
    }, interval);

    return () => window.clearInterval(timer);
  }, [auto, interval, loop, safeTexts.length]);

  return (
    <span className={mainClassName} aria-live="polite">
      <span className={`${elementLevelClassName ?? ""} rb-rotating-text ${visible ? "is-visible" : ""}`}>
        {safeTexts[index]}
      </span>
    </span>
  );
}
