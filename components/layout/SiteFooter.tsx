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
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-8 text-sm text-stone-600 sm:px-8 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. Tech monetization
          briefings for builders and operators.
        </p>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold transition hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
