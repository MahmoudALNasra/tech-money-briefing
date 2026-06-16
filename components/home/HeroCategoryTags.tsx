"use client";

type HeroCategoryTagsProps = {
  categories: string[];
};

const fallbackCategories = [
  "AI Tools",
  "SEO",
  "Fintech",
  "Startups",
  "Ecommerce",
  "Digital Marketing",
  "Creator Business"
];

export function HeroCategoryTags({ categories }: HeroCategoryTagsProps) {
  const visibleCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <div className="hero-tags" aria-label="Signal categories">
      {visibleCategories.map((category, index) => (
        <button
          key={category}
          type="button"
          className={`hero-tag ${index === 0 ? "is-active" : ""}`}
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("trb:terminal-signal", { detail: { category } })
            );
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

