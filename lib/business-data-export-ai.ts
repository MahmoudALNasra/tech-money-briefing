import { getOpenAIClient } from "@/lib/openai";

export type WebsiteEnrichment = {
  emailCandidates: string[];
  websiteReachable: boolean;
  websiteTitle: string;
  metaDescription: string;
  homepageHeadings: string[];
  socialLinks: string[];
  contactUrl: string;
  hasContactPage: boolean;
  signal: string;
};

export type BusinessAiInsight = {
  website_analysis: string;
  business_opportunity_summary: string;
  recommended_pitch: string;
  pitch_angle: string;
};

export type ExportBusinessContext = {
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  googleMapsUrl: string;
  rating: number | null;
  totalReviews: number | null;
  openNow: boolean | null;
  businessStatus: string;
  types: string;
  weekdayHours: string;
  enrichment: WebsiteEnrichment;
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeWebsiteUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function extractEmails(html: string) {
  const decoded = html
    .replace(/%40/g, "@")
    .replace(/\s*\[at\]\s*/gi, "@")
    .replace(/\s*\(at\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[dot\]\s*/gi, ".")
    .replace(/\s*\(dot\)\s*/gi, ".");

  const matches =
    decoded.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];

  return uniqueValues(
    matches
      .map((email) => email.toLowerCase())
      .filter((email) => !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email))
  ).slice(0, 5);
}

function extractTitle(html: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  return title.replace(/\s+/g, " ").trim().slice(0, 140);
}

function extractMetaDescription(html: string) {
  const match =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i
    );

  return (match?.[1] ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
}

function extractHeadings(html: string) {
  const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi))
    .map((match) => match[1]?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);

  return uniqueValues(headings).slice(0, 8);
}

function extractSocialLinks(baseUrl: string, html: string) {
  const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map(
    (match) => match[1]
  );
  const socialPatterns = [
    /facebook\.com/i,
    /instagram\.com/i,
    /linkedin\.com/i,
    /twitter\.com/i,
    /x\.com/i,
    /tiktok\.com/i,
    /youtube\.com/i
  ];

  const links = hrefs
    .map((href) => {
      try {
        return new URL(href, baseUrl).toString();
      } catch {
        return "";
      }
    })
    .filter((href) => socialPatterns.some((pattern) => pattern.test(href)));

  return uniqueValues(links).slice(0, 6);
}

function findContactUrl(baseUrl: string, html: string) {
  const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map(
    (match) => match[1]
  );
  const contactHref = hrefs.find((href) => /contact|about|connect|get-in-touch/i.test(href));

  if (!contactHref) {
    return "";
  }

  try {
    return new URL(contactHref, baseUrl).toString();
  } catch {
    return "";
  }
}

async function fetchText(url: string, maxBytes = 180_000) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TechRevenueBriefBusinessData/1.0"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    return "";
  }

  const text = await response.text();
  return text.slice(0, maxBytes);
}

export async function enrichWebsite(website: string): Promise<WebsiteEnrichment> {
  const normalizedUrl = normalizeWebsiteUrl(website);

  if (!normalizedUrl) {
    return {
      emailCandidates: [],
      websiteReachable: false,
      websiteTitle: "",
      metaDescription: "",
      homepageHeadings: [],
      socialLinks: [],
      contactUrl: "",
      hasContactPage: false,
      signal: "No website found in Google Places."
    };
  }

  try {
    const html = await fetchText(normalizedUrl);
    const contactUrl = html ? findContactUrl(normalizedUrl, html) : "";
    const contactHtml = contactUrl ? await fetchText(contactUrl) : "";
    const emails = uniqueValues([
      ...extractEmails(html),
      ...extractEmails(contactHtml)
    ]).slice(0, 5);
    const metaDescription = extractMetaDescription(html);
    const homepageHeadings = extractHeadings(html);
    const socialLinks = extractSocialLinks(normalizedUrl, html);

    return {
      emailCandidates: emails,
      websiteReachable: Boolean(html),
      websiteTitle: extractTitle(html),
      metaDescription,
      homepageHeadings,
      socialLinks,
      contactUrl,
      hasContactPage: Boolean(contactUrl),
      signal:
        emails.length > 0
          ? "Public email found on website."
          : contactUrl
            ? "Contact page found, but no public email detected."
            : metaDescription
              ? "Website found with metadata, but no obvious contact page/email detected."
              : "Website found, but limited public contact signals detected."
    };
  } catch {
    return {
      emailCandidates: [],
      websiteReachable: false,
      websiteTitle: "",
      metaDescription: "",
      homepageHeadings: [],
      socialLinks: [],
      contactUrl: "",
      hasContactPage: false,
      signal: "Website could not be reached during export."
    };
  }
}

function fallbackInsight(context: ExportBusinessContext): BusinessAiInsight {
  const hasWebsite = Boolean(context.website && context.enrichment.websiteReachable);
  const reviewSignal =
    context.totalReviews && context.rating
      ? `${context.rating.toFixed(1)} stars across ${context.totalReviews} Google reviews`
      : context.rating
        ? `${context.rating.toFixed(1)} star Google rating`
        : "limited public review data";
  const baseServices = [
    "🛠️ **SERVICE: Local SEO & Schema Markup**\n🎯 **Why it matters:** The business may not be clearly positioned for local searches.\n💡 **Pitch angle:** Improve local keywords, metadata, and structured data so more ready-to-buy customers find them.",
    "🤖 **SERVICE: Lead Capture & Follow-up Automation**\n🎯 **Why it matters:** Website visitors can disappear without a clear next step.\n💡 **Pitch angle:** Add stronger calls-to-action, forms, WhatsApp/chat prompts, and simple follow-up flows."
  ].join("\n\n");

  if (hasWebsite) {
    const websiteSignals = [
      context.enrichment.websiteTitle
        ? `Homepage title: ${context.enrichment.websiteTitle}`
        : "",
      context.enrichment.metaDescription
        ? `Meta description: ${context.enrichment.metaDescription}`
        : "",
      context.enrichment.homepageHeadings.length
        ? `Headings: ${context.enrichment.homepageHeadings.slice(0, 4).join(" | ")}`
        : "",
      context.enrichment.hasContactPage
        ? "Contact page detected"
        : "No obvious contact page detected",
      context.enrichment.socialLinks.length
        ? `Social links: ${context.enrichment.socialLinks.slice(0, 3).join(", ")}`
        : "No social links detected on homepage"
    ]
      .filter(Boolean)
      .join(". ");

    return {
      website_analysis: `🎯 **RECOMMENDED SERVICES TO PITCH**\n\n${baseServices}\n\n✅ **SERVICE: Website Trust & Conversion Cleanup**\n🔎 **Signal found:** ${context.enrichment.signal}\n🧩 **Observed clues:** ${websiteSignals}\n💡 **Pitch angle:** Improve the homepage, contact flow, trust signals, and conversion path so more visitors become calls, bookings, or leads.\n\n📱 **SERVICE: Mobile Experience Audit**\n⚠️ **Important:** No exact speed score was measured here.\n💡 **Pitch angle:** A mobile UX and speed audit is still worth offering because local buyers often decide quickly from their phone.`,
      business_opportunity_summary: `• 📊 Improve local SEO visibility for ${context.category} searches\n• 🧲 Capture more leads from existing traffic\n• ✅ Strengthen trust using ${reviewSignal}\n• 📱 Audit mobile UX and page speed as a conversion opportunity`,
      recommended_pitch: `👋 Hi ${context.name.split(/[,\-|]/)[0]?.trim() || "there"},\n\n🔎 **Quick opportunity I noticed:** ${context.name} already has ${reviewSignal}, but the website could work harder to turn visitors into calls, bookings, or leads.\n\n🚀 **3 wins I can help with:**\n✅ Stronger local SEO visibility\n✅ Clearer trust/contact flow\n✅ Better lead capture from existing visitors\n\n📩 Want me to send a short audit with the highest-impact fixes?`,
      pitch_angle: "Website conversion and local SEO"
    };
  }

  return {
    website_analysis: `🎯 **RECOMMENDED SERVICES TO PITCH**\n\n🌐 **SERVICE: Website Launch / Landing Page**\n🔎 **Signal found:** No reachable website was found for ${context.name}.\n⭐ **Trust clue:** ${reviewSignal}\n💡 **Pitch angle:** Build a simple, credible page with services, phone, map, and lead capture so local searchers can convert faster.\n\n${baseServices}\n\n📍 **SERVICE: Business Profile Optimization**\n🎯 **Why it matters:** Without a website, the public listing becomes the main sales asset.\n💡 **Pitch angle:** Strengthen categories, photos, review responses, and booking/contact paths so more searches become calls.`,
    business_opportunity_summary: `• 📍 Build a credible local web presence for ${context.category}\n• 🔎 Help customers find the business beyond map listings\n• ⭐ Leverage ${reviewSignal} with stronger trust signals\n• 📞 Turn searches into calls, bookings, or form leads`,
    recommended_pitch: `👋 Hi ${context.name.split(/[,\-|]/)[0]?.trim() || "there"},\n\n📍 **I found ${context.name} while reviewing local ${context.category} businesses** near ${context.address || "your area"}.\n\n⚡ **Big opportunity:** Customers may be searching, but without a clear website or booking/contact flow, some leads may go to competitors.\n\n🚀 **Simple wins:**\n✅ Fast local landing page\n✅ Clear call/booking buttons\n✅ Stronger trust signals from reviews\n\n📩 Want me to outline a quick launch plan?`,
    pitch_angle: "Digital presence launch"
  };
}

function cleanAiField(value: unknown, maxLength: number) {
  const text = stringifyAiField(value);

  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function stringifyAiField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyAiField(item))
      .filter(Boolean)
      .map((item) => (item.trim().startsWith("•") ? item : `• ${item}`))
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = stringifyAiField(entry);
        return text ? `• ${key.replace(/_/g, " ")}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export async function generateBusinessAiInsight(
  context: ExportBusinessContext
): Promise<BusinessAiInsight> {
  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior local-business growth consultant. Return JSON only with string values for keys: website_analysis, business_opportunity_summary, recommended_pitch, pitch_angle. Use polished, easy-to-scan language with tasteful emojis, short sections, and **bold-style Markdown headlines** inside text fields. Ground every observation in the provided business and website signals. Do not return nested objects or arrays. Never invent measured metrics, analytics tools, ad pixels, or speed scores unless the input explicitly confirms them. Treat mobile speed, GA4, Meta Pixel, and conversion tracking as audit opportunities unless detected."
        },
        {
          role: "user",
          content: JSON.stringify({
            business: {
              name: context.name,
              category: context.category,
              address: context.address,
              phone: context.phone,
              website: context.website,
              google_maps_url: context.googleMapsUrl,
              rating: context.rating,
              total_reviews: context.totalReviews,
              open_now: context.openNow,
              business_status: context.businessStatus,
              types: context.types,
              weekday_hours: context.weekdayHours
            },
            website_signals: context.enrichment,
            instructions: [
              "website_analysis must be easy to skim. Start with '🎯 **RECOMMENDED SERVICES TO PITCH**' and use short service blocks separated by blank lines.",
              "Each website_analysis service block should use 3-4 short lines with emoji labels such as '🛠️ **SERVICE:**', '🔎 **Signal:**', '🎯 **Why it matters:**', and '💡 **Pitch angle:**'.",
              "When a reachable website exists, base recommendations on title, meta description, headings, contact URL, email candidates, social links, reachable status, and conversion/trust gaps visible from those signals.",
              "When no website or unreachable website exists, focus on why online presence matters for this exact business using category, address, rating, review count, and local-search context.",
              "You may recommend services such as Local SEO & Schema Markup, Lead Generation / CRO Automation, Website Trust/CRO, WhatsApp/chat automation, landing page redesign, review generation, booking flow optimization, business profile optimization, and mobile UX/speed audits.",
              "Do NOT claim exact PageSpeed scores, GA4 presence, Meta Pixel presence, or ad tracking unless the input explicitly confirms those signals.",
              "If mobile speed matters, phrase it as an audit opportunity (for example: 'A mobile performance audit is worth pitching because...').",
              "Reference the business by name and category where helpful so the analysis feels specific, not generic.",
              "business_opportunity_summary must be 3-5 bullet points.",
              "recommended_pitch must be ready to send, emoji-rich, and easy to read. Use a greeting, 2-3 short sections with **bold-style Markdown headlines**, and 3 concise ✅ bullets.",
              "pitch_angle must be a short label like 'Website conversion and local SEO' or 'Digital presence launch'.",
              "Keep every field as a string. Never return objects."
            ]
          })
        }
      ]
    });

    const parsed = JSON.parse(completion.choices[0]?.message.content ?? "{}") as Partial<BusinessAiInsight>;

    return {
      website_analysis: cleanAiField(parsed.website_analysis, 1200) || fallbackInsight(context).website_analysis,
      business_opportunity_summary:
        cleanAiField(parsed.business_opportunity_summary, 800) ||
        fallbackInsight(context).business_opportunity_summary,
      recommended_pitch:
        cleanAiField(parsed.recommended_pitch, 1200) || fallbackInsight(context).recommended_pitch,
      pitch_angle: cleanAiField(parsed.pitch_angle, 120) || fallbackInsight(context).pitch_angle
    };
  } catch {
    return fallbackInsight(context);
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    const batch = items.slice(index, index + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => mapper(item, index + batchIndex))
    );
    results.push(...batchResults);
  }

  return results;
}
