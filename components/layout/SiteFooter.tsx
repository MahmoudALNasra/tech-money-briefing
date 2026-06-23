import Link from "next/link";

import { isAdsenseReviewMode } from "@/lib/adsense-readiness";
import { siteSocialProfiles } from "@/lib/page-metadata";
import { siteConfig } from "@/lib/site";

const baseFooterLinks = [
  { href: "/tools", label: "Free Tools" },
  { href: "/compare", label: "Comparisons" },
  { href: "/monetization-checklist", label: "Monetization Checklist" },
  { href: "/monetization-audit", label: "Free Audit" },
  { href: "/local-business-insights", label: "Local Insights" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/advertise", label: "Advertise" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" }
] as const;

const reviewGatedFooterHrefs = new Set([
  "/tools",
  "/compare",
  "/monetization-checklist",
  "/monetization-audit",
  "/local-business-insights"
]);

function getFooterLinks() {
  if (!isAdsenseReviewMode()) {
    return [...baseFooterLinks];
  }

  return baseFooterLinks.filter((link) => !reviewGatedFooterHrefs.has(link.href));
}

const socialLinks = [
  {
    href: siteSocialProfiles.instagram,
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    )
  },
  {
    href: siteSocialProfiles.linkedin,
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.25h4.56V23.5H.22V8.25zM8.5 8.25h4.37v2.08h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 6.99v8.56H17.7v-7.58c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.9 1.97-2.9 4v7.72H8.5V8.25z" />
      </svg>
    )
  },
  {
    href: siteSocialProfiles.github,
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M12 .5C5.65.5.58 5.56.58 11.91c0 5.01 3.29 9.26 7.86 10.76.57.11.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.8 10.8 0 0 1 2.88-.39c.98.01 1.97.13 2.88.39 2.19-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.28 5.69.42.36.79 1.08.79 2.18 0 1.57-.01 2.84-.01 3.22 0 .31.21.67.79.55A11.15 11.15 0 0 0 23.42 11.91C23.42 5.56 18.35.5 12 .5z" />
      </svg>
    )
  },
  {
    href: siteSocialProfiles.crunchbase,
    label: "Crunchbase",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2.5 4.25v11.5h2.75v-4.1h2.1c2.2 0 3.65-1.35 3.65-3.7 0-2.2-1.35-3.7-3.55-3.7H6.5zm2.75 2.1h1.65c1.05 0 1.6.55 1.6 1.55s-.55 1.55-1.6 1.55H9.25v-3.1z" />
      </svg>
    )
  }
];

export function SiteFooter() {
  const footerLinks = getFooterLinks();

  return (
    <footer className="border-t border-white/[0.06] bg-[var(--bg-surface)]">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-6 px-5 py-10 text-sm text-[var(--text-muted)] sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-md flex-col gap-4">
          <p className="font-sans text-sm leading-6">
            © {new Date().getFullYear()} {siteConfig.name}. Tech monetization
            briefings for builders and operators.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${siteConfig.name} on ${link.label}`}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-[var(--text-dim)] transition hover:border-white/20 hover:text-[var(--text-secondary)]"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-dim)] transition hover:text-[var(--text-secondary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
