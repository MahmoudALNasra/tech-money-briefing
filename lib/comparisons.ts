export type ComparisonRow = {
  label: string;
  left: string;
  right: string;
};

export type ComparisonPage = {
  slug: string;
  title: string;
  description: string;
  productA: string;
  productB: string;
  summary: string;
  bestForA: string[];
  bestForB: string[];
  decisionRows: ComparisonRow[];
  monetizationAngle: string;
  relatedToolHrefs: string[];
  keywords: string[];
};

export const COMPARISONS: ComparisonPage[] = [
  {
    slug: "beehiiv-vs-substack",
    title: "Beehiiv vs Substack",
    description:
      "Compare Beehiiv and Substack for newsletter growth, monetization, design control, and publisher revenue.",
    productA: "Beehiiv",
    productB: "Substack",
    summary:
      "Beehiiv is built for growth-focused publishers who want more control over design, ads, and referral mechanics. Substack is simpler and stronger when discovery and paid subscriptions are the core product.",
    bestForA: [
      "Publishers who want ad network and sponsorship tooling",
      "Teams optimizing growth loops and referral programs",
      "Operators who want more design and landing page control"
    ],
    bestForB: [
      "Writers who want the fastest path to paid subscriptions",
      "Creators who value built-in network effects",
      "Solo operators who prefer minimal setup"
    ],
    decisionRows: [
      { label: "Monetization", left: "Ads, boosts, paid tiers", right: "Paid subscriptions first" },
      { label: "Growth tooling", left: "Referrals, recommendations", right: "Network discovery" },
      { label: "Design control", left: "Higher", right: "Simpler defaults" },
      { label: "Best fit", left: "Publisher businesses", right: "Writer-first newsletters" }
    ],
    monetizationAngle:
      "If your goal is RPM-style newsletter revenue, model list size and conversion with a newsletter revenue calculator before switching platforms.",
    relatedToolHrefs: [
      "/newsletter-revenue-calculator",
      "/newsletter-subject-line-generator",
      "/utm-builder"
    ],
    keywords: ["beehiiv vs substack", "newsletter platform comparison"]
  },
  {
    slug: "convertkit-vs-mailchimp",
    title: "ConvertKit vs Mailchimp",
    description:
      "Compare ConvertKit and Mailchimp for creators, automations, ecommerce email, and list monetization.",
    productA: "ConvertKit",
    productB: "Mailchimp",
    summary:
      "ConvertKit is optimized for creators selling digital products and running simple automations. Mailchimp is broader and stronger for ecommerce brands that need templates, CRM features, and multichannel campaigns.",
    bestForA: ["Creators and coaches", "Digital product launches", "Tag-based automations"],
    bestForB: ["Ecommerce stores", "Larger marketing teams", "Broad campaign tooling"],
    decisionRows: [
      { label: "Audience", left: "Creators", right: "SMB + ecommerce" },
      { label: "Automation", left: "Simple, creator-first", right: "Mature journey builder" },
      { label: "Commerce", left: "Digital products", right: "Store integrations" },
      { label: "Pricing curve", left: "Scales with creators", right: "Feature-heavy tiers" }
    ],
    monetizationAngle:
      "Email revenue depends on offer quality and list health more than ESP branding. Estimate revenue per send before upgrading plans.",
    relatedToolHrefs: ["/newsletter-revenue-calculator", "/newsletter-subject-line-generator"],
    keywords: ["convertkit vs mailchimp", "email marketing comparison"]
  },
  {
    slug: "shopify-vs-woocommerce",
    title: "Shopify vs WooCommerce",
    description:
      "Compare Shopify and WooCommerce for ecommerce margins, speed to launch, SEO control, and total cost of ownership.",
    productA: "Shopify",
    productB: "WooCommerce",
    summary:
      "Shopify trades flexibility for speed and reliability. WooCommerce on WordPress offers more control and lower platform fees at the cost of more technical overhead.",
    bestForA: ["Fast launches", "DTC brands", "Teams that want managed hosting"],
    bestForB: ["SEO-heavy content stores", "Operators with WordPress skills", "Custom plugin stacks"],
    decisionRows: [
      { label: "Time to launch", left: "Faster", right: "More setup" },
      { label: "Customization", left: "App ecosystem", right: "Plugin + theme depth" },
      { label: "Fees", left: "Platform + apps", right: "Hosting + plugins" },
      { label: "SEO control", left: "Good defaults", right: "Very flexible" }
    ],
    monetizationAngle:
      "Store margin decisions should include ad spend, email capture, and organic traffic. Pair ecommerce tooling with SEO and UTM tracking.",
    relatedToolHrefs: ["/utm-builder", "/meta-description-generator", "/blog-title-generator"],
    keywords: ["shopify vs woocommerce", "ecommerce platform comparison"]
  },
  {
    slug: "semrush-vs-ahrefs",
    title: "Semrush vs Ahrefs",
    description:
      "Compare Semrush and Ahrefs for SEO research, content planning, competitor analysis, and publisher workflows.",
    productA: "Semrush",
    productB: "Ahrefs",
    summary:
      "Semrush is broader across SEO, content, and paid workflows. Ahrefs is often preferred for backlink analysis and clean keyword research for content teams.",
    bestForA: ["Agencies and full-funnel marketers", "Content + PPC in one stack", "Enterprise reporting"],
    bestForB: ["Link building teams", "Publisher SEO research", "Clean keyword workflows"],
    decisionRows: [
      { label: "Backlinks", left: "Strong", right: "Often preferred" },
      { label: "Content tools", left: "Broader suite", right: "Focused SEO" },
      { label: "PPC overlap", left: "Yes", right: "Limited" },
      { label: "Best for", left: "Marketing teams", right: "SEO specialists" }
    ],
    monetizationAngle:
      "SEO tools pay off when they feed publishable pages. Use title and meta generators to turn research into indexable assets faster.",
    relatedToolHrefs: [
      "/blog-title-generator",
      "/meta-description-generator",
      "/robots-txt-generator"
    ],
    keywords: ["semrush vs ahrefs", "SEO tool comparison"]
  },
  {
    slug: "chatgpt-vs-claude",
    title: "ChatGPT vs Claude",
    description:
      "Compare ChatGPT and Claude for writing workflows, research, coding help, and publisher productivity.",
    productA: "ChatGPT",
    productB: "Claude",
    summary:
      "ChatGPT has the broadest ecosystem and plugin surface. Claude is often chosen for long-context writing, careful analysis, and document-heavy workflows.",
    bestForA: ["General productivity", "Multimodal tasks", "Large plugin ecosystem"],
    bestForB: ["Long documents", "Careful drafting", "Analysis-heavy writing"],
    decisionRows: [
      { label: "Ecosystem", left: "Largest", right: "Growing" },
      { label: "Long context", left: "Strong", right: "Often preferred" },
      { label: "Coding help", left: "Very strong", right: "Strong" },
      { label: "Publisher fit", left: "All-round", right: "Drafting + analysis" }
    ],
    monetizationAngle:
      "AI tools improve throughput, not guarantees. Pair them with headline and hook generators, then edit for voice and facts.",
    relatedToolHrefs: ["/ai-headline-generator", "/blog-title-generator", "/tiktok-hook-generator"],
    keywords: ["chatgpt vs claude", "AI writing tools comparison"]
  },
  {
    slug: "mediavine-vs-adsense",
    title: "Mediavine vs AdSense",
    description:
      "Compare Mediavine and Google AdSense for publisher ad revenue, traffic requirements, and RPM expectations.",
    productA: "Mediavine",
    productB: "AdSense",
    summary:
      "Mediavine typically targets established blogs with higher RPM potential and managed ad optimization. AdSense is open to smaller publishers and easier to start, but RPM is often lower.",
    bestForA: ["Established blogs", "Lifestyle and food niches", "Teams wanting managed ad ops"],
    bestForB: ["New publishers", "Fast approval path", "Mixed content sites"],
    decisionRows: [
      { label: "Traffic bar", left: "Higher", right: "Lower" },
      { label: "RPM potential", left: "Often higher", right: "Variable" },
      { label: "Setup speed", left: "Slower", right: "Faster" },
      { label: "Control", left: "Managed", right: "Self-serve" }
    ],
    monetizationAngle:
      "Model pageviews, CTR, and CPC before switching networks. Small traffic gains can matter more than network branding.",
    relatedToolHrefs: [
      "/adsense-revenue-calculator",
      "/adsense-ctr-calculator",
      "/cpm-rpm-calculator"
    ],
    keywords: ["mediavine vs adsense", "publisher ad network comparison"]
  },
  {
    slug: "gumroad-vs-shopify",
    title: "Gumroad vs Shopify",
    description:
      "Compare Gumroad and Shopify for selling digital products, creator offers, and lightweight ecommerce.",
    productA: "Gumroad",
    productB: "Shopify",
    summary:
      "Gumroad is built for fast digital product sales with minimal setup. Shopify is better when you need a full storefront, subscriptions, and physical inventory.",
    bestForA: ["Digital downloads", "Creator offers", "Fast checkout pages"],
    bestForB: ["Full ecommerce brands", "Physical products", "Larger catalogs"],
    decisionRows: [
      { label: "Setup", left: "Minutes", right: "Days to weeks" },
      { label: "Catalog", left: "Lightweight", right: "Scalable" },
      { label: "Fees", left: "Transaction-based", right: "Plan + apps" },
      { label: "Best fit", left: "Creators", right: "Store operators" }
    ],
    monetizationAngle:
      "Creator commerce often wins with email + content, not storefront complexity. Estimate funnel revenue before buying a full ecommerce stack.",
    relatedToolHrefs: ["/newsletter-revenue-calculator", "/utm-builder"],
    keywords: ["gumroad vs shopify", "creator commerce comparison"]
  },
  {
    slug: "beehiiv-vs-convertkit",
    title: "Beehiiv vs ConvertKit",
    description:
      "Compare Beehiiv and ConvertKit for newsletter growth, automations, and creator monetization.",
    productA: "Beehiiv",
    productB: "ConvertKit",
    summary:
      "Beehiiv is newsletter-native with growth and ad tooling. ConvertKit is stronger for creator funnels, product launches, and email automation around digital offers.",
    bestForA: ["Media-style newsletters", "Ad monetization", "Referral growth"],
    bestForB: ["Course and product launches", "Creator funnels", "Tag automations"],
    decisionRows: [
      { label: "Core identity", left: "Newsletter media", right: "Creator CRM" },
      { label: "Ads", left: "Built-in paths", right: "Partner promos" },
      { label: "Automations", left: "Growing", right: "Mature" },
      { label: "Best fit", left: "Publishers", right: "Creators selling offers" }
    ],
    monetizationAngle:
      "Pick the platform that matches your revenue model: ads and sponsorships vs product launches and sequences.",
    relatedToolHrefs: ["/newsletter-revenue-calculator", "/newsletter-subject-line-generator"],
    keywords: ["beehiiv vs convertkit", "newsletter platform comparison"]
  },
  {
    slug: "notion-vs-airtable",
    title: "Notion vs Airtable",
    description:
      "Compare Notion and Airtable for editorial workflows, startup ops, databases, and team collaboration.",
    productA: "Notion",
    productB: "Airtable",
    summary:
      "Notion is best for docs, wikis, and flexible editorial systems in one workspace. Airtable is stronger when structured data, views, and automations across records are the priority.",
    bestForA: ["Editorial calendars in docs", "Team wikis", "Lightweight databases"],
    bestForB: ["Structured ops", "Reporting views", "Record automations"],
    decisionRows: [
      { label: "Docs", left: "Excellent", right: "Secondary" },
      { label: "Database power", left: "Good", right: "Excellent" },
      { label: "Automations", left: "Basic", right: "Strong" },
      { label: "Best fit", left: "Content teams", right: "Ops teams" }
    ],
    monetizationAngle:
      "Ops tooling should reduce time-to-publish. Faster publishing supports more indexable pages and tool landing pages.",
    relatedToolHrefs: ["/blog-title-generator", "/ai-headline-generator"],
    keywords: ["notion vs airtable", "workflow tool comparison"]
  },
  {
    slug: "webflow-vs-wordpress",
    title: "Webflow vs WordPress",
    description:
      "Compare Webflow and WordPress for SEO sites, publisher stacks, design control, and maintenance overhead.",
    productA: "Webflow",
    productB: "WordPress",
    summary:
      "Webflow offers visual precision and cleaner handoffs for marketing sites. WordPress remains the default for content-heavy publishers that need plugins, editorial workflows, and lower hosting flexibility.",
    bestForA: ["Marketing sites", "Design-led brands", "Teams avoiding plugin chaos"],
    bestForB: ["Blogs and publishers", "SEO content at scale", "Plugin ecosystems"],
    decisionRows: [
      { label: "Content publishing", left: "Good", right: "Excellent" },
      { label: "Design control", left: "Excellent", right: "Theme-dependent" },
      { label: "Maintenance", left: "Lower", right: "Plugin overhead" },
      { label: "SEO scale", left: "Solid", right: "Very strong" }
    ],
    monetizationAngle:
      "Publisher SEO wins with publishing velocity. WordPress often wins for volume; Webflow wins for polished marketing sites.",
    relatedToolHrefs: ["/robots-txt-generator", "/meta-description-generator", "/blog-title-generator"],
    keywords: ["webflow vs wordpress", "CMS comparison"]
  },
  {
    slug: "buffer-vs-hootsuite",
    title: "Buffer vs Hootsuite",
    description:
      "Compare Buffer and Hootsuite for social scheduling, team workflows, and distribution for publishers.",
    productA: "Buffer",
    productB: "Hootsuite",
    summary:
      "Buffer is lightweight and creator-friendly for scheduling and analytics. Hootsuite is broader for teams managing many channels, approvals, and listening workflows.",
    bestForA: ["Solo creators", "Simple scheduling", "Clean analytics"],
    bestForB: ["Agencies", "Large social teams", "Enterprise governance"],
    decisionRows: [
      { label: "Complexity", left: "Lower", right: "Higher" },
      { label: "Team workflows", left: "Basic", right: "Advanced" },
      { label: "Channels", left: "Core networks", right: "Broad coverage" },
      { label: "Best fit", left: "Creators", right: "Teams" }
    ],
    monetizationAngle:
      "Distribution tools only matter if creative assets convert. Pair scheduling with thumbnail, X card, and hook generators.",
    relatedToolHrefs: [
      "/youtube-thumbnail-maker",
      "/x-card-generator",
      "/tiktok-hook-generator"
    ],
    keywords: ["buffer vs hootsuite", "social media tool comparison"]
  },
  {
    slug: "canva-vs-adobe-express",
    title: "Canva vs Adobe Express",
    description:
      "Compare Canva and Adobe Express for social creatives, thumbnails, and fast publisher design workflows.",
    productA: "Canva",
    productB: "Adobe Express",
    summary:
      "Canva has the largest template ecosystem for everyday marketing assets. Adobe Express fits teams already in Creative Cloud who want quick social formats with Adobe polish.",
    bestForA: ["Templates at scale", "Non-designers", "Team brand kits"],
    bestForB: ["Adobe ecosystem users", "Quick brand assets", "Lightweight edits"],
    decisionRows: [
      { label: "Templates", left: "Largest library", right: "Growing library" },
      { label: "Learning curve", left: "Low", right: "Low to medium" },
      { label: "Ecosystem", left: "Standalone", right: "Adobe-linked" },
      { label: "Best fit", left: "Creators", right: "Adobe users" }
    ],
    monetizationAngle:
      "Design speed supports more social tests. Combine templates with custom thumbnail and card generators for owned assets.",
    relatedToolHrefs: ["/youtube-thumbnail-maker", "/x-card-generator", "/image-compressor"],
    keywords: ["canva vs adobe express", "design tool comparison"]
  },
  {
    slug: "stripe-vs-paddle",
    title: "Stripe vs Paddle",
    description:
      "Compare Stripe and Paddle for SaaS billing, tax handling, checkout, and global payments.",
    productA: "Stripe",
    productB: "Paddle",
    summary:
      "Stripe is the default flexible payments layer developers integrate everywhere. Paddle bundles merchant of record, tax, and subscription billing for SaaS teams that want less compliance overhead.",
    bestForA: ["Custom billing flows", "Marketplaces", "Developer-first stacks"],
    bestForB: ["SaaS subscriptions", "Global tax simplification", "Faster MoR setup"],
    decisionRows: [
      { label: "Flexibility", left: "Very high", right: "Opinionated" },
      { label: "Tax handling", left: "Add-ons/partners", right: "Built-in MoR" },
      { label: "Integration", left: "Developer-heavy", right: "Simpler SaaS path" },
      { label: "Best fit", left: "Custom products", right: "Subscription SaaS" }
    ],
    monetizationAngle:
      "Payments choice affects net margin and expansion revenue. Model MRR, churn, and LTV before picking a billing stack.",
    relatedToolHrefs: ["/saas-pricing-calculator", "/startup-name-generator"],
    keywords: ["stripe vs paddle", "SaaS payments comparison"]
  },
  {
    slug: "substack-vs-ghost",
    title: "Substack vs Ghost",
    description:
      "Compare Substack and Ghost for paid newsletters, publishing control, SEO, and membership revenue.",
    productA: "Substack",
    productB: "Ghost",
    summary:
      "Substack optimizes for fast newsletter launches and built-in paid subscriptions. Ghost is for publishers who want ownership, SEO-friendly publishing, and more control over membership economics.",
    bestForA: ["Fast newsletter launch", "Built-in network", "Writer-first UX"],
    bestForB: ["Owned publishing stack", "SEO and memberships", "Technical control"],
    decisionRows: [
      { label: "Setup speed", left: "Fastest", right: "More setup" },
      { label: "Ownership", left: "Platform-bound", right: "Higher" },
      { label: "SEO", left: "Good", right: "Strong" },
      { label: "Best fit", left: "Writers", right: "Publisher businesses" }
    ],
    monetizationAngle:
      "Membership revenue compounds with list quality. Estimate paid conversion and churn before migrating platforms.",
    relatedToolHrefs: ["/newsletter-revenue-calculator", "/newsletter-subject-line-generator"],
    keywords: ["substack vs ghost", "newsletter platform comparison"]
  },
  {
    slug: "ahrefs-vs-moz",
    title: "Ahrefs vs Moz",
    description:
      "Compare Ahrefs and Moz for keyword research, link analysis, domain metrics, and SEO reporting.",
    productA: "Ahrefs",
    productB: "Moz",
    summary:
      "Ahrefs is widely used for backlink and keyword research depth. Moz is approachable for domain authority tracking, local SEO, and teams that want simpler reporting.",
    bestForA: ["Link research", "Competitive content analysis", "Publisher SEO teams"],
    bestForB: ["Local SEO", "Domain authority tracking", "Simpler SEO reporting"],
    decisionRows: [
      { label: "Backlink index", left: "Often preferred", right: "Solid" },
      { label: "Keyword research", left: "Deep", right: "Accessible" },
      { label: "Local SEO", left: "Available", right: "Strong heritage" },
      { label: "Best fit", left: "Content SEO", right: "Generalist SEO" }
    ],
    monetizationAngle:
      "SEO software should feed publishable output. Turn research into titles, metas, and internal links to tools and comparisons.",
    relatedToolHrefs: [
      "/blog-title-generator",
      "/meta-description-generator",
      "/robots-txt-generator"
    ],
    keywords: ["ahrefs vs moz", "SEO software comparison"]
  },
  {
    slug: "cursor-vs-github-copilot",
    title: "Cursor vs GitHub Copilot",
    description:
      "Compare Cursor and GitHub Copilot for AI-assisted coding, team workflows, and shipping speed.",
    productA: "Cursor",
    productB: "GitHub Copilot",
    summary:
      "Cursor is an AI-native editor built around chat, agents, and codebase context. GitHub Copilot fits developers who want inline suggestions inside VS Code, JetBrains, and the wider GitHub ecosystem.",
    bestForA: ["Greenfield projects", "Agent-style edits", "Teams wanting an AI-first IDE"],
    bestForB: ["Existing IDE workflows", "GitHub-centric teams", "Inline autocomplete at scale"],
    decisionRows: [
      { label: "IDE model", left: "AI-native editor", right: "Plugin across IDEs" },
      { label: "Codebase context", left: "Strong", right: "Good" },
      { label: "Team adoption", left: "Growing", right: "Mature" },
      { label: "Best fit", left: "Builders shipping fast", right: "Enterprise dev shops" }
    ],
    monetizationAngle:
      "Faster shipping supports more landing pages, tools, and comparisons. Pair AI coding with headline and brief generators so output stays publishable.",
    relatedToolHrefs: ["/ai-headline-generator", "/content-brief-generator", "/blog-title-generator"],
    keywords: ["cursor vs github copilot", "AI coding tools comparison"]
  },
  {
    slug: "digitalocean-vs-render",
    title: "DigitalOcean vs Render",
    description:
      "Compare DigitalOcean and Render for app hosting, databases, pricing predictability, and startup deployments.",
    productA: "DigitalOcean",
    productB: "Render",
    summary:
      "DigitalOcean offers flexible VPS, managed databases, and predictable droplet pricing. Render simplifies deploy-from-Git workflows with less infrastructure thinking for small teams.",
    bestForA: ["Droplets and Kubernetes", "Predictable infra control", "Referral-friendly cloud credits"],
    bestForB: ["Git-based deploys", "Small web apps", "Teams avoiding server admin"],
    decisionRows: [
      { label: "Deploy model", left: "You configure", right: "Git push deploy" },
      { label: "Control", left: "Higher", right: "More abstracted" },
      { label: "Pricing", left: "Droplet-based", right: "Service-based" },
      { label: "Best fit", left: "Infra-aware teams", right: "Fast app launches" }
    ],
    monetizationAngle:
      "Hosting choice affects margin on SaaS and content sites. Model traffic and conversion before scaling instances or adding managed services.",
    relatedToolHrefs: ["/saas-pricing-calculator", "/utm-builder", "/robots-txt-generator"],
    keywords: ["digitalocean vs render", "cloud hosting comparison"]
  },
  {
    slug: "google-workspace-vs-zoho",
    title: "Google Workspace vs Zoho",
    description:
      "Compare Google Workspace and Zoho for email, docs, CRM overlap, and small-business software stacks.",
    productA: "Google Workspace",
    productB: "Zoho",
    summary:
      "Google Workspace is the default for Gmail, Docs, Drive, and Meet in one familiar bundle. Zoho bundles CRM, books, support, and ops tools for teams that want more business software in one vendor.",
    bestForA: ["Gmail-first teams", "Collaboration defaults", "Google ecosystem users"],
    bestForB: ["CRM-led SMBs", "All-in-one ops", "Cost-sensitive stacks"],
    decisionRows: [
      { label: "Email and docs", left: "Excellent", right: "Solid" },
      { label: "CRM depth", left: "Add-ons", right: "Native suite" },
      { label: "Pricing", left: "Per user", right: "Often competitive bundles" },
      { label: "Best fit", left: "Collaboration-first", right: "Operations-first SMBs" }
    ],
    monetizationAngle:
      "Stack decisions affect workflow speed and vendor spend. Pick the suite that matches how you sell, support customers, and publish content.",
    relatedToolHrefs: ["/newsletter-subject-line-generator", "/utm-builder", "/startup-name-generator"],
    keywords: ["google workspace vs zoho", "business software comparison"]
  },
  {
    slug: "frase-vs-surfer",
    title: "Frase vs Surfer",
    description:
      "Compare Frase and Surfer for AI SEO content, briefs, on-page optimization, and publisher workflows.",
    productA: "Frase",
    productB: "Surfer",
    summary:
      "Frase emphasizes research, briefs, and AI drafting around search intent. Surfer is known for content scoring, SERP-driven structure, and on-page optimization workflows.",
    bestForA: ["Briefs and outlines", "FAQ-heavy pages", "Research-to-draft speed"],
    bestForB: ["On-page scoring", "Content optimization", "SERP structure alignment"],
    decisionRows: [
      { label: "Briefs", left: "Strong", right: "Available" },
      { label: "On-page scoring", left: "Good", right: "Core strength" },
      { label: "AI drafting", left: "Strong", right: "Strong" },
      { label: "Best fit", left: "Editorial planning", right: "Optimization-led SEO" }
    ],
    monetizationAngle:
      "AI SEO tools pay off when they produce indexable pages. Pair them with free brief, title, and meta generators to ship assets faster.",
    relatedToolHrefs: [
      "/content-brief-generator",
      "/blog-title-generator",
      "/meta-description-generator",
      "/keyword-cluster-tool"
    ],
    keywords: ["frase vs surfer", "AI SEO tools comparison", "best AI SEO tools"]
  }
];

export function getComparisonBySlug(slug: string) {
  return COMPARISONS.find((comparison) => comparison.slug === slug);
}

export function getAllComparisonSlugs() {
  return COMPARISONS.map((comparison) => comparison.slug);
}
