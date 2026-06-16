import Link from "next/link";

import { siteConfig } from "@/lib/site";

const footerLinks = [
  { href: "/tools", label: "Free Tools" },
  { href: "/compare", label: "Comparisons" },
  { href: "/monetization-checklist", label: "Monetization Checklist" },
  { href: "/monetization-audit", label: "Free Audit" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/advertise", label: "Advertise" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[var(--bg-surface)]">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-6 px-5 py-10 text-sm text-[var(--text-muted)] sm:px-8 md:flex-row md:items-center md:justify-between">
        <p className="max-w-md font-sans text-sm leading-6">
          © {new Date().getFullYear()} {siteConfig.name}. Tech monetization
          briefings for builders and operators.
        </p>
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
