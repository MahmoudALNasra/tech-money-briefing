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
