export type ReferralOffer = {
  id: string;
  name: string;
  title: string;
  description: string;
  referralUrl: string;
  articlePath: string;
  cta: string;
};

export const REFERRAL_OFFERS: ReferralOffer[] = [
  {
    id: "digitalocean",
    name: "DigitalOcean",
    title: "DigitalOcean has a referral signup link",
    description:
      "Useful for builders who need cloud hosting, AI infrastructure, apps, databases, or storage.",
    referralUrl: "https://m.do.co/c/623910f50e6e",
    articlePath:
      "/startups/digitalocean-referral-link-click-here-to-sign-up-for-cloud-credit",
    cta: "Read the DigitalOcean referral guide"
  },
  {
    id: "cursor",
    name: "Cursor",
    title: "Cursor has a referral signup link",
    description:
      "Useful for developers and operators who want an AI coding editor for shipping faster.",
    referralUrl: "https://cursor.com/referral?code=CVAAK5BXQ5CO",
    articlePath:
      "/ai-tools/cursor-referral-link-click-here-to-sign-up-for-cursor-ai",
    cta: "Read the Cursor referral guide"
  },
  {
    id: "zoho",
    name: "Zoho",
    title: "Zoho has a referral signup link",
    description:
      "Useful for small businesses comparing CRM, email, books, support, and operations tools.",
    referralUrl:
      "https://store.zoho.com/referral.do?ref=844526020872bb25b0a158d6bbfda59bfb09ef6a908ba66e3442c9020e82b85f94862e778e4f46eccadf30862b0de349",
    articlePath:
      "/digital-marketing/zoho-referral-link-click-here-to-sign-up-for-business-software",
    cta: "Read the Zoho referral guide"
  }
];
