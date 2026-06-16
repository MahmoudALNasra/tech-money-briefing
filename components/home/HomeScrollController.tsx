"use client";

import { useEffect } from "react";

export function HomeScrollController() {
  useEffect(() => {
    const heroEl = document.getElementById("hero");
    const progressBarEl = document.getElementById("progress-bar");
    const orbEl = document.querySelector<HTMLElement>(".hero-orb-blue");

    if (!heroEl || !progressBarEl) {
      return;
    }

    let ticking = false;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      const heroH = heroEl.offsetHeight || window.innerHeight;
      const docH = document.body.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? Math.min(scrollY / docH, 1) : 0;

      progressBarEl.style.width = `${pct * 100}%`;

      if (orbEl) {
        orbEl.style.transform = `translate(calc(-50% + ${scrollY * 0.06}px), -50%)`;
        orbEl.style.opacity = Math.max(0, 1 - (scrollY / heroH) * 1.5).toString();
      }

      const threshold = heroH * 0.55;

      if (scrollY > threshold) {
        heroEl.classList.add("hero-fading");
      }

      if (scrollY < heroH * 0.2) {
        heroEl.classList.remove("hero-fading");
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        updateScrollState();
        ticking = false;
      });
    };

    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div id="progress-bar" aria-hidden="true" />;
}

