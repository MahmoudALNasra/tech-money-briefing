"use client";

import { useEffect, useState } from "react";

import RotatingText from "@/components/ui/RotatingText";

type HeroArticle = {
  title?: string;
  headline?: string;
};

declare global {
  interface Window {
    __TRB_ARTICLES__?: HeroArticle[];
  }
}

const fallbackWords = ["intelligence", "leads", "signal", "briefs", "revenue"];

function wordsFromTitle(title: string) {
  return title
    .replace(/^(I would not|How I would|Why I would)/i, "")
    .trim()
    .split(" ")
    .slice(0, 2)
    .join(" ")
    .toLowerCase();
}

function getRotatingWordsFromArticles() {
  const articles = window.__TRB_ARTICLES__ || [];

  if (articles.length > 0) {
    const articleWords = articles
      .slice(0, 8)
      .map((article) => wordsFromTitle(article.title || article.headline || ""))
      .filter((word) => word.length > 2);

    if (articleWords.length > 0) {
      return articleWords;
    }
  }

  const headings = Array.from(
    document.querySelectorAll<HTMLElement>("#articles .card-title, #articles h2")
  );

  if (headings.length > 0) {
    const headingWords = headings
      .slice(0, 6)
      .map((heading) => wordsFromTitle(heading.textContent || ""))
      .filter((word) => word.length > 2);

    if (headingWords.length > 0) {
      return headingWords;
    }
  }

  return fallbackWords;
}

export function RotatingHeroWord() {
  const [words, setWords] = useState(fallbackWords);

  useEffect(() => {
    const refreshWords = () => {
      const nextWords = getRotatingWordsFromArticles();
      setWords(nextWords.length >= 3 ? nextWords : fallbackWords);
    };

    refreshWords();

    if (document.readyState !== "complete") {
      window.addEventListener("load", refreshWords, { once: true });
    }

    return () => {
      window.removeEventListener("load", refreshWords);
    };
  }, []);

  return (
    <RotatingText
      texts={words}
      interval={2800}
      splitBy="word"
      mainClassName="rotating-word-wrapper"
      elementLevelClassName="rotating-word"
      loop
      auto
    />
  );
}

