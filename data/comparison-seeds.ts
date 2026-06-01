/**
 * Queue for `npm run compare:generate`. Slugs already in curated or generated JSON are skipped.
 */
export type ComparisonSeed = {
  slug: string;
  productA: string;
  productB: string;
  category: "seo" | "saas" | "hosting" | "analytics" | "creator" | "data" | "ecommerce";
  notes?: string;
};

export const COMPARISON_SEEDS: ComparisonSeed[] = [
  {
    slug: "cloudflare-vs-aws-cloudfront",
    productA: "Cloudflare",
    productB: "AWS CloudFront",
    category: "hosting",
    notes: "CDN, caching, security, pricing for publishers"
  },
  {
    slug: "matomo-vs-google-analytics",
    productA: "Matomo",
    productB: "Google Analytics",
    category: "analytics"
  },
  {
    slug: "rank-math-vs-yoast",
    productA: "Rank Math",
    productB: "Yoast SEO",
    category: "seo",
    notes: "WordPress SEO plugins"
  },
  {
    slug: "surfer-vs-clearscope",
    productA: "Surfer",
    productB: "Clearscope",
    category: "seo",
    notes: "Content optimization tools"
  },
  {
    slug: "hubspot-vs-pipedrive",
    productA: "HubSpot",
    productB: "Pipedrive",
    category: "saas"
  },
  {
    slug: "railway-vs-render",
    productA: "Railway",
    productB: "Render",
    category: "hosting"
  },
  {
    slug: "planetscale-vs-neon",
    productA: "PlanetScale",
    productB: "Neon",
    category: "data",
    notes: "Serverless MySQL vs Postgres"
  },
  {
    slug: "klaviyo-vs-mailchimp",
    productA: "Klaviyo",
    productB: "Mailchimp",
    category: "ecommerce"
  },
  {
    slug: "jasper-vs-copy-ai",
    productA: "Jasper",
    productB: "Copy.ai",
    category: "creator"
  },
  {
    slug: "loom-vs-riverside",
    productA: "Loom",
    productB: "Riverside",
    category: "creator"
  },
  {
    slug: "hotjar-vs-microsoft-clarity",
    productA: "Hotjar",
    productB: "Microsoft Clarity",
    category: "analytics"
  },
  {
    slug: "aws-lambda-vs-cloudflare-workers",
    productA: "AWS Lambda",
    productB: "Cloudflare Workers",
    category: "hosting"
  }
];
