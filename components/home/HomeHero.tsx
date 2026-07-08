import Link from "next/link";

import { HeroCategoryTags } from "@/components/home/HeroCategoryTags";
import { RotatingHeroWord } from "@/components/home/RotatingHeroWord";
import { TerminalFeedDynamic } from "@/components/home/TerminalFeedDynamic";
import BlurText from "@/components/ui/BlurText";

type HomeHeroProps = {
  categories: string[];
};

export function HomeHero({ categories }: HomeHeroProps) {
  return (
    <section id="hero" className="trb-hero" aria-labelledby="home-hero-title">
      <div className="hero-grid-bg" aria-hidden="true" />
      <div className="hero-orb hero-orb-blue" aria-hidden="true" />
      <div className="hero-orb hero-orb-purple" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-line" />
            <span>Signal Feed</span>
            <span className="hero-live-badge"><span />Live</span>
          </div>

          <h1 id="home-hero-title" className="hero-title">
            <BlurText
              text="Analyst-grade"
              delay={80}
              animateBy="words"
              direction="top"
              className="blur-headline-word"
            /> <br />
            <RotatingHeroWord /> <br />
            <BlurText
              text="for operators."
              delay={160}
              animateBy="words"
              direction="top"
              className="blur-headline-word"
            />
          </h1>

          <p className="hero-subtitle">
            Tech Revenue Brief turns AI tools, SEO, fintech, startup, ecommerce,
            and lead generation signals into practical briefings for people who
            need decisions, not another content feed.
          </p>

          <div className="hero-actions">
            <Link className="hero-button hero-button-primary" href="#articles">
              Read latest briefs
            </Link>
            <Link className="hero-button hero-button-ghost" href="/compare">
              Browse comparisons
            </Link>
            <Link className="hero-button hero-button-ghost" href="/leads">
              Try lead generator
            </Link>
          </div>

          <HeroCategoryTags categories={categories} />
        </div>

        <div className="hero-terminal-wrap">
          <TerminalFeedDynamic />
        </div>
      </div>

      <div className="scroll-indicator" aria-hidden="true">
        <span>Scroll</span>
        <span className="scroll-line" />
      </div>
    </section>
  );
}

