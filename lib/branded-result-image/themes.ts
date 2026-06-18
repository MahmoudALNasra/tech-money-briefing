export const BRANDED_IMAGE_THEME_IDS = [
  "amber-slate",
  "neon-midnight",
  "coral-burst",
  "ocean-signal"
] as const;

export type BrandedImageThemeId = (typeof BRANDED_IMAGE_THEME_IDS)[number];

export type BrandedImageTheme = {
  id: BrandedImageThemeId;
  outerBackground: string;
  cardShadow: string;
  hookBackground: string;
  hookEyebrowColor: string;
  hookTextColor: string;
  eyebrowLabel: string;
  sectionLabelColor: string;
  badgeBackground: string;
  badgeColor: string;
  badgeBorder: string;
  punchBackground: string;
  punchBorder: string;
  punchLabelColor: string;
  punchTextColor: string;
  punchLabel: string;
  footerBorder: string;
  siteUrlColor: string;
  ctaBackground: string;
  ctaColor: string;
  ctaText: string;
};

export const BRANDED_IMAGE_THEMES: Record<BrandedImageThemeId, BrandedImageTheme> = {
  "amber-slate": {
    id: "amber-slate",
    outerBackground: "linear-gradient(145deg, #0f172a 0%, #1e293b 42%, #064e3b 100%)",
    cardShadow: "0 28px 80px rgba(0, 0, 0, 0.35)",
    hookBackground: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
    hookEyebrowColor: "#78350f",
    hookTextColor: "#0c0a09",
    eyebrowLabel: "🔎 Real /leads scan",
    sectionLabelColor: "#64748b",
    badgeBackground: "#ecfdf5",
    badgeColor: "#065f46",
    badgeBorder: "#6ee7b7",
    punchBackground: "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
    punchBorder: "#34d399",
    punchLabelColor: "#047857",
    punchTextColor: "#064e3b",
    punchLabel: "The hook",
    footerBorder: "#e2e8f0",
    siteUrlColor: "#0f766e",
    ctaBackground: "#0f172a",
    ctaColor: "#f8fafc",
    ctaText: "Run your free scan →"
  },
  "neon-midnight": {
    id: "neon-midnight",
    outerBackground: "linear-gradient(145deg, #020617 0%, #312e81 48%, #4c1d95 100%)",
    cardShadow: "0 28px 80px rgba(88, 28, 135, 0.45)",
    hookBackground: "linear-gradient(90deg, #22d3ee 0%, #818cf8 100%)",
    hookEyebrowColor: "#0e7490",
    hookTextColor: "#020617",
    eyebrowLabel: "⚡ Live opportunity scan",
    sectionLabelColor: "#94a3b8",
    badgeBackground: "#1e1b4b",
    badgeColor: "#c4b5fd",
    badgeBorder: "#7c3aed",
    punchBackground: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)",
    punchBorder: "#a78bfa",
    punchLabelColor: "#ddd6fe",
    punchTextColor: "#f5f3ff",
    punchLabel: "Why it pops",
    footerBorder: "#334155",
    siteUrlColor: "#67e8f9",
    ctaBackground: "linear-gradient(90deg, #7c3aed 0%, #4f46e5 100%)",
    ctaColor: "#ffffff",
    ctaText: "Scan free on /leads →"
  },
  "coral-burst": {
    id: "coral-burst",
    outerBackground: "linear-gradient(145deg, #450a0a 0%, #7f1d1d 50%, #9a3412 100%)",
    cardShadow: "0 28px 80px rgba(127, 29, 29, 0.4)",
    hookBackground: "linear-gradient(90deg, #fb7185 0%, #f97316 100%)",
    hookEyebrowColor: "#7f1d1d",
    hookTextColor: "#1c1917",
    eyebrowLabel: "🚨 Gap spotted",
    sectionLabelColor: "#78716c",
    badgeBackground: "#fff7ed",
    badgeColor: "#c2410c",
    badgeBorder: "#fdba74",
    punchBackground: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
    punchBorder: "#fb923c",
    punchLabelColor: "#c2410c",
    punchTextColor: "#7c2d12",
    punchLabel: "Pitch angle",
    footerBorder: "#fed7aa",
    siteUrlColor: "#ea580c",
    ctaBackground: "#7f1d1d",
    ctaColor: "#fff7ed",
    ctaText: "Free scan → /leads"
  },
  "ocean-signal": {
    id: "ocean-signal",
    outerBackground: "linear-gradient(145deg, #082f49 0%, #0c4a6e 45%, #164e63 100%)",
    cardShadow: "0 28px 80px rgba(8, 47, 73, 0.42)",
    hookBackground: "linear-gradient(90deg, #38bdf8 0%, #2dd4bf 100%)",
    hookEyebrowColor: "#0c4a6e",
    hookTextColor: "#082f49",
    eyebrowLabel: "📡 Signal check",
    sectionLabelColor: "#64748b",
    badgeBackground: "#ecfeff",
    badgeColor: "#0e7490",
    badgeBorder: "#67e8f9",
    punchBackground: "linear-gradient(180deg, #ecfeff 0%, #cffafe 100%)",
    punchBorder: "#22d3ee",
    punchLabelColor: "#0e7490",
    punchTextColor: "#164e63",
    punchLabel: "Opportunity",
    footerBorder: "#bae6fd",
    siteUrlColor: "#0369a1",
    ctaBackground: "#0c4a6e",
    ctaColor: "#ecfeff",
    ctaText: "Try /leads free →"
  }
};

export function getBrandedImageTheme(themeId: BrandedImageThemeId) {
  return BRANDED_IMAGE_THEMES[themeId];
}
