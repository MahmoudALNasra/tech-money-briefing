import { siteConfig } from "@/lib/site";
import { getOfficialProductUrl } from "@/lib/product-official-urls";

export type ReferralLink = {
  product: string;
  href: string;
  aliases: string[];
  disclosure: string;
};

export type ProductOutboundLink = {
  product: string;
  href: string;
  isReferral: boolean;
  disclosure: string;
};

export const REFERRAL_LINKS: ReferralLink[] = [
  {
    product: "Substack",
    href: "https://substack.com/refer/mahmoud.81",
    aliases: ["substack"],
    disclosure: "Publishing is free to start; paid subscriptions use Substack's current terms."
  },
  {
    product: "Zoho",
    href: "https://store.zoho.com/referral.do?ref=5b83702640adb779ee07df3de7055cb10e8beb802297c70f7bc616ad7d1b20d1d3bf537352155f0e398d113d10c09c30",
    aliases: ["zoho", "zoho one", "zoho crm", "zoho workspace"],
    disclosure: "Use Zoho's current product and pricing pages to confirm the right app bundle."
  },
  {
    product: "Google Workspace",
    href: "https://workspace.google.com/landing/partners/referral/gws2/?utm_source=sign-up&utm_medium=affiliatereferral&utm_campaign=apps-referral-program&utm_content=Z85O3XH",
    aliases: ["google workspace", "workspace", "gmail for business"],
    disclosure: "This referral path is for Google Workspace signup through the partner referral program."
  },
  {
    product: "Google Ads",
    href: "https://business.google.com/us/google-ads/welcome-offer/?utm_source=ads-refer&utm_medium=refer-program&utm_campaign=sv-copylinkbutton",
    aliases: ["google ads", "google adwords", "keyword planner"],
    disclosure: "New advertiser offers and spend requirements can change; review Google's terms before launching."
  },
  {
    product: "Cursor",
    href: "https://cursor.com/referral?code=CVAAK5BXQ5CO",
    aliases: ["cursor", "cursor ai"],
    disclosure: "Cursor is an AI coding editor; check current plan limits before upgrading."
  },
  {
    product: "DigitalOcean",
    href: `${siteConfig.url}/startups/digitalocean-referral-link-click-here-to-sign-up-for-cloud-credit`,
    aliases: ["digitalocean", "digital ocean", "do cloud"],
    disclosure: "This points to our DigitalOcean referral guide with signup context and disclosure."
  },
  {
    product: "Shopify",
    href: "https://shopify.pxf.io/c/7367441/1061744/13624",
    aliases: ["shopify"],
    disclosure: "Shopify plans and promotional offers change; confirm current terms before starting."
  }
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function containsAlias(text: string, referral: ReferralLink) {
  const normalizedText = ` ${normalize(text)} `;

  return referral.aliases.some((alias) =>
    normalizedText.includes(` ${normalize(alias)} `)
  );
}

export function getReferralLinkForProduct(product: string) {
  return REFERRAL_LINKS.find(
    (referral) =>
      normalize(referral.product) === normalize(product) ||
      referral.aliases.some((alias) => normalize(alias) === normalize(product))
  );
}

export function getProductOutboundLink(product: string): ProductOutboundLink | null {
  const referral = getReferralLinkForProduct(product);

  if (referral) {
    return {
      product: referral.product,
      href: referral.href,
      isReferral: true,
      disclosure: referral.disclosure
    };
  }

  const officialUrl = getOfficialProductUrl(product);

  if (!officialUrl) {
    return null;
  }

  return {
    product,
    href: officialUrl,
    isReferral: false,
    disclosure: "Opens the official product website in a new tab."
  };
}

export function getReferralLinksForText(text: string, limit = 4) {
  return REFERRAL_LINKS.filter((referral) => containsAlias(text, referral)).slice(
    0,
    limit
  );
}

export function isExternalReferralUrl(href: string) {
  return href.startsWith("http") && !href.startsWith(siteConfig.url);
}
