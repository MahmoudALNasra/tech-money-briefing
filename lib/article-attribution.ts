export const ARTICLE_EDITORIAL_SOURCE_NAME = "Tech Revenue Brief Editors";

export const ARTICLE_EDITORIAL_SOURCE_NOTE =
  "By Tech Revenue Brief Editors.";

export const ARTICLE_ORIGINALITY_INSTRUCTIONS = [
  "Use outside articles, RSS items, trends, or reference URLs as topic discovery and background context only.",
  "Do not copy the source structure, phrasing, or paragraph order. Rebuild the article from Tech Revenue Brief's own practical point of view.",
  "Do not include a visible Source, Original source, Read more, or citation footer unless the article uses a specific quote, statistic, official claim, or source-only fact that needs verification.",
  "Do not include a bottom 'Related links', 'Related on Tech Revenue Brief', or 'Read next' section. Weave internal links into the article body where they make sense.",
  "Write with a direct, practical operator voice. Skepticism should come from specific trade-offs and examples, not from repeating the same 'I would not / Don't assume / Your X' formula in every paragraph.",
  "Prefer real decision questions, simple examples, and business-owner logic over polished corporate language.",
  "Vary sentence construction and section openings across articles. Do not reuse one rhetorical template as the dominant structure.",
  "Keep the style guide flexible because future owner-written samples may refine the voice."
];

/** Slugs already rewritten to detector-passed owner voice — skip in bulk runs. */
export const OWNER_VOICE_SKIP_SLUGS = [
  "how-to-use-ai-to-generate-startup-name-ideas-without-sounding-generic",
  "best-chatgpt-prompts-for-small-business-owners",
  "how-to-price-a-saas-product-a-practical-formula-for-founders",
  "navigating-regulatory-risks-insights-from-amazon-ceo-s-concerns-on-anthropic-ai-models",
  "how-to-leverage-memes-for-viral-marketing-a-guide-for-startups",
  "harnessing-google-s-audience-loyalty-ecosystem-for-seo-success",
  "woocommerce-vs-shopify-seo-which-platform-gives-you-more-control",
  "saas-pricing-page-best-practices-how-to-structure-plans-that-convert",
  "ramp-s-750m-funding-round-implications-for-fintech-investors-and-operators",
  "rpm-vs-cpm-explained-what-publishers-and-creators-need-to-know",
  "navigating-the-future-of-ai-generated-music-implications-for-the-b2b-music-industry",
  "navigating-the-impacts-of-google-s-may-core-update-on-seo-monetization-strategies",
  "patina-s-2-million-funding-round-a-disruptive-force-in-the-stagnant-fragrance-industry",
  "navigating-the-risks-of-ai-hallucinations-insights-from-kpmg-s-report-withdrawal",
  "implications-of-meta-s-2b-manus-deal-cancellation-on-ai-tool-partnerships",
  "navigating-india-s-ai-future-insights-from-the-anthropic-suspension",
  "navigating-the-ai-ipo-landscape-opportunities-and-risks-for-investors",
  "shopify-seo-checklist-product-pages-collections-and-technical-basics",
  "how-to-use-ai-for-shopify-product-descriptions-that-convert",
  "understanding-ai-memory-systems-implications-for-seo-professionals",
  "integrating-accessibility-and-seo-streamlining-audits-for-optimal-performance",
  "leveraging-ai-insights-to-optimize-consumer-search-behavior-for-cmos",
  "navigating-search-visibility-in-the-age-of-apple-gemini-powered-siri",
  "navigating-the-shifting-seo-landscape-insights-from-reddit-and-google-analytics-4",
  "navigating-the-tennessee-search-blacklist-essential-guidance-for-seo-professionals",
  "how-to-use-ai-for-google-ads-without-wasting-budget",
  "navigating-the-costs-of-ai-bots-strategies-for-website-owners-to-mitigate-server-overload",
  "navigating-google-s-sponsored-shops-implications-for-digital-advertisers",
  "how-to-use-ai-for-facebook-ads-copy-creative-angles-and-testing",
  "best-ai-tools-for-digital-marketing-teams-a-practical-workflow",
  "google-analytics-utm-best-practices-for-campaign-tracking",
  "harnessing-ai-for-brand-defense-strategies-for-digital-marketers",
  "crafting-a-distinctive-brand-identity-for-your-ecommerce-venture",
  "unlocking-startup-potential-innovations-to-lower-living-costs",
  "how-to-use-utm-parameters-correctly-a-simple-tracking-guide",
  "navigating-the-future-how-jedify-s-24m-funding-boosts-ai-context-solutions-for-startups",
  "warner-music-s-strategic-acquisition-of-sureel-ai-implications-for-startups-in-the-music-i",
  "niteshift-a-new-player-in-ai-coding-aiming-to-disrupt-big-ai-lock-in",
  "harnessing-enterprise-ai-insights-from-vivatech-2026-for-startups",
  "leveraging-ai-driven-insights-for-restaurant-discovery-startups",
  "how-to-calculate-adsense-earnings-from-pageviews-ctr-and-rpm",
  "evotrex-s-30m-funding-a-game-changer-for-the-rv-industry",
  "mangos-the-new-wave-of-startup-titans-in-tech",
  "how-to-calculate-newsletter-revenue-before-you-grow-the-list",
  "beehiiv-vs-substack-for-monetization-which-is-better-for-creators",
  "strategic-insights-on-apple-s-ai-tools-unveiled-at-wwdc-2023",
  "implications-of-openai-s-confidential-ipo-filing-for-ai-tools-and-investors",
  "analyzing-apple-s-ai-innovations-at-wwdc-2023-implications-for-b2b-professionals",
  "understanding-the-implications-of-dual-pricing-in-venture-capital-a-case-study-on-sequoia",
  "apple-s-strategic-shift-in-ai-a-slow-approach-with-smart-outcomes",
  "navigating-the-implications-of-openai-s-ipo-for-ai-tool-developers",
  "newsletter-subject-line-formulas-for-higher-opens",
  "how-to-start-a-niche-newsletter-that-can-actually-make-money",
  "leveraging-google-analytics-for-enhanced-insights-from-google-business-profile",
  "navigating-google-s-authority-in-seo-implications-for-b2b-professionals",
  "navigating-the-shift-from-ai-citations-to-transactions-in-seo",
  "navigating-the-impact-of-google-ask-maps-updates-on-business-profiles",
  "leveraging-eye-tracking-insights-to-enhance-international-seo-strategies",
  "programmatic-seo-for-small-sites-when-it-works-and-when-it-fails",
  "internal-linking-best-practices-for-blogs-tools-and-comparison-pages",
  "how-to-use-utm-parameters-for-affiliate-and-referral-links",
  "top-5-transformative-seo-books-to-elevate-your-strategy-this-summer",
  "exploring-the-future-of-home-robotics-insights-from-hello-robot-s-latest-launch",
  "how-to-build-a-local-lead-list-from-competitor-research",
  "local-competitor-analysis-checklist-for-small-businesses",
  "who-are-my-local-competitors-how-to-build-a-useful-competitor-list",
  "how-to-identify-content-gaps-for-seo",
  "how-to-analyze-serp-intent-before-you-write-a-page",
  "anticipating-siri-s-revamp-implications-for-ai-tools-in-b2b-operations",
  "understanding-openai-s-lockdown-mode-enhancing-security-for-ai-tools",
  "the-future-of-openai-s-super-app-implications-for-ai-tool-integration",
  "navigating-service-disruptions-insights-from-notion-s-restoration-of-anthropic-access",
  "navigating-the-tokenpocalypse-strategic-insights-for-ai-tools-professionals",
  "how-to-use-a-keyword-cluster-tool-for-content-planning",
  "seo-content-brief-template-what-to-include-before-you-write",
  "understanding-and-mitigating-migration-hangover-traffic-drops-in-seo",
  "navigating-google-s-ai-search-data-testing-implications-for-seo-professionals",
  "navigating-ftc-complaints-a-guide-for-seo-professionals-on-reporting-unethical-practices",
  "leveraging-ai-visitor-tracking-for-enhanced-seo-insights",
  "navigating-google-s-ai-search-opt-out-implications-for-seo-professionals",
  "helion-fusion-startup-secures-465m-implications-for-energy-innovation-and-startup-investme",
  "maximizing-opportunities-at-startup-battlefield-australia-2023",
  "exploring-the-next-generation-of-social-apps-opportunities-for-startups",
  "how-to-do-keyword-research-with-ai-without-chasing-bad-keywords",
  "meta-description-examples-how-to-write-snippets-that-earn-clicks",
  "blog-title-formulas-that-work-for-seo-and-social-sharing",
  "navigating-fundraising-opportunities-at-strictlyvc-los-angeles-for-defense-tech-startups",
  "understanding-supabase-s-rapid-valuation-growth-implications-for-startup-investors",
  "how-to-make-youtube-thumbnails-with-ai-and-simple-design-rules",
  "how-to-write-youtube-titles-that-get-clicks-without-clickbait",
  "mira-murati-s-strategic-visibility-in-ai-tools-a-game-changer-for-industry-leaders",
  "airtrunk-s-30b-investment-transforming-india-s-ai-data-center-landscape",
  "navigating-the-together-tech-wave-implications-for-ai-driven-startups-in-2026",
  "innovative-ai-startups-promoting-digital-detox-a-new-frontier-for-well-being",
  "maximizing-your-chances-insights-on-the-startup-battlefield-200-application-process",
  "best-ai-tools-for-youtube-creators-titles-thumbnails-scripts-and-analytics",
  "best-ai-tools-for-content-creators-a-practical-stack",
  "gemini-vs-chatgpt-for-marketing-what-each-tool-is-best-at",
  "claude-vs-chatgpt-for-business-which-ai-assistant-fits-your-workflow",
  "navigating-the-shift-sundar-pichai-s-vision-for-ai-in-google-search",
  "measuring-content-alignment-a-critical-seo-strategy-for-b2b-professionals",
  "leveraging-google-search-profiles-a-game-changer-for-creators-with-100k-followers",
  "understanding-the-impact-of-google-s-may-2023-core-update-on-seo-strategies",
  "navigating-the-decline-of-referral-traffic-strategies-for-small-publishers-in-the-age-of-a",
  "how-to-use-claude-for-coding-best-use-cases-and-limits",
  "how-to-use-chatgpt-for-market-research-without-making-things-up",
  "exploring-board-the-new-game-startup-revolutionizing-together-tech",
  "focused-energy-secures-240m-series-a-implications-for-the-fusion-tech-startup-landscape",
  "everand-s-innovative-subscription-model-a-game-changer-for-startups-in-the-digital-reading",
  "transforming-financial-markets-insights-from-voice-ai-startups-founded-by-ex-goldman-and-m",
  "analyzing-firstclub-s-rapid-valuation-growth-in-quick-commerce",
  "chatgpt-prompts-for-seo-titles-outlines-meta-descriptions-and-faqs",
  "how-to-use-cursor-with-github-without-breaking-your-repo",
  "cursor-composer-vs-chat-which-one-should-you-use",
  "best-cursor-prompts-for-coding-examples-that-actually-help",
  "coralogix-s-200m-investment-a-new-era-for-ai-monitoring-tools",
  "unlocking-business-potential-meta-s-ai-agent-for-whatsapp-business",
  "navigating-the-new-ai-search-opt-out-regulations-a-guide-for-publishers",
  "leveraging-ai-generated-product-images-on-amazon-implications-for-b2b-professionals",
  "exploring-google-dreambeans-transforming-personal-data-into-cartoon-narratives",
  "understanding-the-implications-of-alphabet-s-85b-investment-in-ai-tools",
  "strategic-implications-of-lovable-s-multiyear-deal-with-google-cloud-for-ai-tool-developme",
  "how-to-use-cursor-ai-for-beginners-setup-prompts-and-workflow",
  "how-to-use-ai-for-internal-linking-to-enhance-topical-authority",
  "implications-of-uber-s-ai-spending-cap-on-employee-innovation-and-tool-utilization",
  "understanding-cyera-s-12b-valuation-implications-for-ai-tools-investors",
  "how-to-use-cursor-to-build-and-ship-a-next-js-site-faster",
  "chatgpt-vs-claude-vs-gemini-for-writing-a-practical-comparison",
  "optimizing-your-website-for-ai-citation-essential-audit-strategies",
  "navigating-the-shift-adapting-seo-strategies-post-mit-research-insights",
  "understanding-google-s-speculative-stance-on-llms-implications-for-seo-professionals",
  "leveraging-google-s-lighthouse-for-enhanced-website-performance-and-seo",
  "navigating-the-impact-of-google-s-may-2023-core-update-on-seo-strategies",
  "how-to-use-an-adsense-rpm-calculator-to-forecast-revenue",
  "how-to-use-a-utm-builder-for-clean-campaign-attribution",
  "understanding-patrick-mahomes-target-market-a-guide-for-sports-marketers",
  "how-rooftop-and-floating-solar-solutions-can-alleviate-india-s-power-crisis",
  "unlocking-success-your-guide-to-the-startup-battlefield-top-20",
  "softbank-s-75b-investment-in-french-data-centers-implications-for-ai-tools",
  "how-to-use-a-youtube-title-generator-in-your-creator-workflow",
  "harnessing-ai-for-superior-weather-forecasting-insights-from-windborne",
  "how-to-compress-images-for-core-web-vitals-tool-workflow",
  "nvidia-s-strategic-move-into-ai-agent-pcs-implications-for-b2b-professionals",
  "how-to-build-a-prompt-library-for-your-publishing-team",
  "alphabet-s-80-billion-investment-implications-for-ai-tools-and-industry-growth",
  "cursor-agent-mode-explained-for-non-engineer-operators",
  "navigating-the-cfaa-implications-for-ai-agents-and-website-access",
  "revolut-s-strategic-entry-into-india-implications-for-fintech-professionals",
  "tracking-the-trajectories-of-startup-battlefield-alumni-insights-for-founders",
  "navigating-the-ai-investment-landscape-insights-from-top-vcs",
  "leveraging-duckduckgo-s-no-ai-search-engine-for-enhanced-privacy-in-b2b-operations",
  "understanding-the-implications-of-anthropic-s-ipo-for-ai-tool-developers",
  "implications-of-florida-s-lawsuit-against-openai-for-ai-tool-developers",
  "understanding-google-s-new-ai-guide-key-insights-for-seo-professionals",
  "transforming-customer-reviews-into-business-infrastructure-for-seo-success",
  "understanding-the-implications-of-sundar-pichai-s-comments-on-google-zero-for-seo-professi",
  "leveraging-entitymap-for-enhanced-seo-strategies-in-ai-driven-environments",
  "analyzing-the-surge-in-funding-for-black-founders-trends-and-implications-for-startups",
  "how-fintech-founders-can-use-ai-without-compliance-surprises",
  "navigating-artist-tech-collaborations-kc-green-and-artisan-ai-s-groundbreaking-agreement",
  "navigating-the-risks-of-ai-over-reliance-in-business-operations",
  "the-double-edged-sword-of-ai-dependency-for-coders-navigating-risks-and-rewards",
  "unlocking-efficiency-how-google-gemini-spark-ai-assistant-enhances-daily-operations",
  "exploring-the-potential-of-the-meta-ai-pendant-in-b2b-applications",
  "navigating-the-ai-psychosis-debate-implications-for-ai-tools-professionals",
  "how-to-use-ai-for-ecommerce-product-copy-and-pdp-seo",
  "how-to-automate-newsletter-drafts-with-ai-safely",
  "how-to-use-midjourney-for-marketing-visuals-without-brand-drift",
  "navigating-the-browser-wars-essential-alternatives-for-startup-founders-in-2026",
  "unlocking-opportunities-the-ghost-angels-fund-by-snap-alumni",
  "navigating-the-shift-implications-of-github-copilot-s-token-based-billing-for-developers",
  "navigating-the-new-google-serp-layout-strategies-for-seo-professionals",
  "navigating-the-new-business-visibility-challenges-unveiled-at-google-i-o-2023",
  "essential-free-woocommerce-extensions-for-new-ecommerce-stores",
  "optimizing-your-ecommerce-shipping-setup-for-growth",
  "how-to-use-perplexity-for-market-research",
  "best-ai-tools-for-solo-founders-in-2026-stack-not-hype",
  "github-copilot-vs-cursor-which-fits-your-team",
  "understanding-ai-psychosis-implications-for-startup-leadership-2",
  "navigating-the-future-groq-s-650m-funding-and-its-impact-on-ai-chip-startups",
  "decoding-ai-terminology-essential-terms-for-professionals-in-ai-tools",
  "last-chance-to-secure-techcrunch-disrupt-2026-tickets-insights-for-startups",
  "maximize-your-startup-s-visibility-apply-to-speak-at-techcrunch-disrupt-2026",
  "the-role-of-ai-coding-agents-in-supporting-human-programmers-insights-from-cognition-s-sco",
  "groq-ai-chip-startup-secures-650m-funding-to-enhance-ai-inference-capabilities",
  "leveraging-youtube-s-new-ai-podcast-features-for-enhanced-audience-engagement",
  "understanding-recursive-self-improvement-rsi-in-ai-tools-a-new-paradigm-shift",
  "leveraging-gmail-brand-lift-for-enhanced-advertising-impact",
  "corgi-s-rapid-valuation-surge-implications-for-startup-investors",
  "unlocking-ai-potential-how-xcena-s-135m-funding-addresses-memory-bottlenecks",
  "how-to-use-notion-ai-for-operator-documentation",
  "how-to-use-ai-for-seo-meta-descriptions-that-actually-convert",
  "apple-s-siri-app-a-game-changer-in-ai-tools-for-2023",
  "unlocking-the-potential-of-sesame-ai-a-conversational-tool-for-enhanced-user-engagement",
  "understanding-the-implications-of-anthropic-s-lease-with-spacex-for-ai-tool-development",
  "unlocking-efficiency-exploring-anthropic-s-opus-4-8-dynamic-workflow-tool",
  "navigating-the-emerging-landscape-of-ai-token-futures-trading",
  "unlocking-opportunities-at-the-strictlyvc-los-angeles-networking-event",
  "paris-the-emerging-ai-startup-capital-beyond-silicon-valley",
  "h1-s-40m-funding-round-a-case-study-in-saas-investment-trends",
  "leveraging-bluesky-s-long-form-content-for-startup-growth",
  "essential-steps-for-applying-to-startup-battlefield-2026-a-guide-for-startups",
  "anthropic-s-65-billion-fundraising-implications-for-the-ai-tools-market",
  "asana-s-strategic-acquisition-of-stackai-implications-for-no-code-development-in-ai-tools",
  "redesigning-cloud-infrastructure-for-ai-implications-for-machine-learning-tools",
  "glean-ai-transforming-budget-management-for-enterprises-in-2023",
  "navigating-the-ai-sameness-trap-strategies-for-seo-professionals",
  "harnessing-ai-in-seo-understanding-the-execution-and-judgment-layers",
  "maximize-your-roi-last-chance-for-techcrunch-disrupt-2026-ticket-savings",
  "unlocking-executive-efficiency-the-role-of-ai-foldables-for-ceos",
  "exploring-the-next-big-player-in-ai-compute-sambanova-s-rise",
  "unlocking-agentic-payments-visa-s-strategic-investment-in-replit-for-developers",
  "navigating-the-ai-driven-landscape-of-google-search-implications-for-digital-marketers",
  "understanding-google-s-ai-spelling-challenges-implications-for-ai-tool-development",
  "navigating-google-s-challenges-in-agentic-coding-insights-from-pichai",
  "understanding-youtube-s-new-ai-video-labeling-feature-implications-for-content-creators",
  "clickhouse-s-revenue-surge-implications-for-ai-tools-market-and-future-ipo",
  "navigating-the-impacts-of-china-s-ai-talent-retention-on-global-ai-development",
  "how-to-build-a-daily-content-workflow-with-ai-tools",
  "how-to-use-an-ai-headline-generator-in-your-publishing-stack",
  "how-to-use-claude-for-long-form-research-and-analysis",
  "how-to-use-chatgpt-for-blog-writing-without-sounding-generic",
  "how-to-write-cursor-rules-that-improve-ai-output",
  "cursor-vs-chatgpt-for-coding-when-to-use-each",
  "leveraging-ai-for-revenue-growth-in-payroll-services-insights-from-remote-s-success",
  "strategic-implications-of-snowflake-s-6b-partnership-with-aws-for-ai-tools",
  "understanding-ai-psychosis-implications-for-startup-leadership",
  "adapting-startup-seo-strategies-in-an-ai-driven-search-landscape",
  "how-to-use-cursor-for-coding-a-practical-setup-guide",
  "harnessing-ai-in-oncology-strategic-insights-for-startups-in-healthcare-technology",
  "leveraging-elevenlabs-music-generation-model-for-dynamic-genre-switching-in-ai-tools",
  "weroad-s-58m-funding-implications-for-startups-in-the-travel-sector",
  "sond-pioneering-ai-driven-sleep-solutions-for-startups",
  "cognition-s-1b-funding-round-implications-for-startup-valuations-in-ai",
  "comparative-analysis-of-core-web-vitals-wordpress-vs-astro-for-seo-professionals",
  "navigating-google-s-unchanging-standards-in-an-ai-driven-seo-landscape",
  "understanding-the-psychological-barriers-in-enterprise-seo-implementation",
  "leveraging-ai-trading-agents-implications-for-fintech-professionals",
  "navigating-meta-s-new-subscription-models-implications-for-ai-tool-development",
  "essential-pre-launch-testing-checklist-for-ecommerce-websites",
  "harnessing-ai-for-enhanced-product-discovery-in-e-commerce",
  "impact-of-google-s-ai-update-on-search-queries-a-focus-on-keywords",
  "navigating-the-smart-glasses-landscape-insights-for-ai-tools-professionals",
  "navigating-ai-security-insights-and-implications-for-b2b-professionals",
  "navigating-user-sentiment-the-surge-in-duckduckgo-installs-amidst-ai-search-backlash",
  "launching-a-successful-e-commerce-pet-business-strategic-insights-for-industry-professiona",
  "insights-from-225-leaders-on-ai-s-impact-on-e-commerce-strategies",
  "enhancing-woocommerce-user-experience-with-jetpack-search-3-0-s-product-aware-filters",
  "stord-s-250m-funding-round-implications-for-startups-competing-with-amazon",
  "maximizing-your-startup-s-chances-in-battlefield-2026-key-insights-and-strategies",
  "navigating-the-new-ai-music-landscape-implications-of-umg-and-tiktok-s-renewed-agreement",
  "leveraging-india-s-gig-economy-for-ai-training-data-a-new-frontier",
  "openrouter-s-valuation-surge-implications-for-ai-tool-development-and-market-dynamics",
  "maximizing-seo-efficiency-the-critical-role-of-robots-txt-in-digital-marketing",
  "optimizing-small-business-strategies-for-ai-powered-search-a-tactical-guide",
  "maximizing-conversion-rates-essential-landing-page-design-strategies-for-ecommerce-profess",
  "innovative-pitch-strategies-how-lucra-sports-secured-20m-in-funding-against-the-ai-trend",
  "leveraging-ai-for-enhanced-local-seo-strategies",
  "impact-of-ai-overviews-on-user-engagement-and-seo-strategy",
  "implementing-machine-first-architecture-for-enhanced-seo-performance",
  "preparing-your-ecommerce-store-for-the-ai-driven-future",
  "optimizing-ecommerce-product-descriptions-for-search-and-ai-rankings",
  "optimizing-ecommerce-operations-key-updates-from-woocommerce-10-7",
  "leveraging-ai-tools-for-workforce-optimization-lessons-from-clickup-s-layoff-strategy",
  "leveraging-ai-citations-for-enhanced-brand-visibility-in-seo",
  "leveraging-google-s-ucp-for-enhanced-seo-performance-in-e-commerce",
  "strategies-for-developing-non-commodity-content-in-seo",
  "understanding-google-s-ai-powered-search-box-implications-for-seo-strategy",
  "the-evolving-landscape-of-digital-pr-emphasizing-seo-fundamentals-in-the-age-of-ai-search",
  "leveraging-woocommerce-mcp-for-enhanced-e-commerce-interactions",
  "essential-considerations-for-selecting-woocommerce-hosting-in-2026",
  "navigating-the-privacy-landscape-of-ai-wearables-insights-from-amazon-s-bee",
  "understanding-the-implications-of-ai-mentions-in-seo-strategies-for-b2b-brands",
  "optimizing-publishing-workflows-for-enhanced-seo-and-revenue-generation",
  "understanding-google-s-llms-txt-guidance-implications-for-seo-professionals",
  "understanding-cloudflare-s-agent-readiness-score-implications-for-seo-professionals",
  "challenging-the-dominance-amazon-and-meta-s-strategic-moves-in-india-s-fintech-landscape",
  "maximizing-sales-through-youtube-shopping-integration-for-woocommerce",
  "leveraging-social-accountability-in-goal-tracking-insights-from-paprclip-s-launch",
  "transforming-social-media-engagement-status-ai-s-17m-funding-and-its-implications-for-star",
  "investment-surge-in-india-s-rooftop-solar-startups-implications-for-emerging-businesses",
  "leveraging-ai-to-reconstruct-historical-aviation-communications-implications-for-safety-an",
  "leveraging-markdown-for-enhanced-seo-in-developer-documentation",
  "navigating-aeo-essential-content-strategies-for-seo-professionals-in-2026",
  "understanding-the-economic-risks-of-seo-post-google-i-o",
  "navigating-the-new-eu-withdrawal-link-requirement-for-e-commerce-businesses",
  "maximizing-revenue-with-woocommerce-subscriptions-health-check",
  "navigating-sales-tax-compliance-for-growing-ecommerce-businesses",
  "critical-hosting-insights-for-ecommerce-merchants-a-guide-to-infrastructure-decisions",
  "fundamentals-of-ecommerce-seo-for-2026-a-strategic-guide-for-professionals",
  "harnessing-ai-for-email-security-a-startup-s-journey-from-hacker-to-innovator",
  "understanding-spacex-s-s-1-filing-implications-for-startup-valuation-and-market-entry",
  "peec-s-revenue-surge-implications-for-european-startups-in-ai-search-tracking",
  "understanding-the-impact-of-inflated-arr-metrics-on-ai-startup-valuations",
  "leveraging-ai-to-enhance-fan-engagement-in-formula-1-insights-from-ferrari-and-ibm",
  "leveraging-microsoft-clarity-s-grounding-queries-for-enhanced-seo-insights",
  "optimizing-staging-environments-for-seo-risk-mitigation-best-practices",
  "navigating-the-fragmented-landscape-of-llm-guidance-for-seo-professionals",
  "maximizing-social-media-strategy-essential-tools-for-digital-marketers-in-2026",
  "top-content-marketing-agencies-to-elevate-your-digital-strategy-in-2026",
  "maximizing-visibility-the-strategic-role-of-linkedin-articles-in-digital-marketing",
  "navigating-the-tiktok-sale-implications-for-digital-advertisers",
  "harnessing-ai-for-scalable-lead-generation-in-multi-location-digital-marketing",
  "critical-decisions-for-establishing-a-successful-e-commerce-platform",
  "expanding-in-person-payment-capabilities-a-strategic-move-for-ecommerce-professionals",
  "enhancing-e-commerce-user-experience-with-jetpack-search-3-0-a-deep-dive",
  "implications-of-google-s-may-2026-core-update-for-seo-professionals",
  "exploring-the-impact-of-google-s-ai-powered-xr-glasses-on-b2b-operations",
  "harnessing-sensor-technology-the-future-of-maritime-operations-for-startups",
  "navigating-funding-decisions-insights-from-nanoclaw-s-12m-seed-round",
  "navigating-investment-trends-lucra-s-20m-esports-funding-amid-ai-dominance",
  "raising-capital-in-a-post-ai-world-insights-from-lucra-s-20m-funding-success",
  "sam-altman-s-game-changing-investment-offer-implications-for-y-combinator-startups",
  "leveraging-viral-video-strategies-insights-from-clouted-s-7m-seed-round",
  "implications-of-openai-s-ipo-for-ai-tools-market-dynamics",
  "irisgo-transforming-desktop-productivity-with-ai-automation",
  "openai-s-breakthrough-in-geometry-implications-for-ai-tools-in-mathematical-problem-solvin",
  "the-financial-implications-of-anthropic-s-1-25b-monthly-compute-deal-with-xai",
  "leveraging-expert-insights-the-impact-of-spi-media-s-experts-in-residence-on-creator-busin",
  "leveraging-podcasting-as-a-strategic-tool-for-creator-businesses",
  "four-proven-strategies-for-rapid-subscriber-growth-on-youtube-insights-from-aprilynne-alte",
  "maximizing-email-marketing-efficiency-with-kit-a-strategic-analysis-for-creators",
  "leveraging-tiered-membership-models-for-enhanced-engagement-in-creator-businesses",
  "navigating-google-s-helpful-content-update-insights-from-a-7-figure-online-business",
  "maximizing-profit-margins-the-top-30-items-for-flipping-in-the-online-business-sector",
  "monetizing-personal-data-strategic-insights-for-online-business-professionals",
  "maximizing-revenue-potential-leveraging-odd-job-apps-for-online-business-growth",
  "leveraging-service-business-models-for-sustainable-online-income",
  "maximizing-revenue-streams-the-power-of-side-hustle-stacking-for-online-businesses",
  "10-essential-rules-for-building-wealth-in-online-business",
  "exploring-lucrative-fitness-side-hustles-for-online-entrepreneurs",
  "maximizing-revenue-streams-insights-from-a-successful-billboard-business",
  "maximizing-remote-work-opportunities-a-deep-dive-into-flexjobs-for-online-business-profess",
  "translating-search-performance-metrics-into-tangible-business-outcomes-for-seo-monetizatio",
  "enhancing-payment-security-in-fintech-the-role-of-ai-enabled-digital-wallets",
  "strategic-insights-from-skio-s-105m-acquisition-implications-for-subscription-billing-in-f",
  "paypal-s-ai-driven-transformation-implications-for-fintech-professionals",
  "robinhood-s-venture-fund-a-new-paradigm-for-retail-investor-participation-in-private-marke",
  "ramp-s-valuation-surge-implications-for-fintech-investors-and-market-dynamics",
  "bankruptcy-of-parker-implications-for-fintech-startups-and-investors",
  "strategic-implications-of-venmo-s-spin-off-and-market-dynamics-in-fintech",
  "ai-driven-bookkeeping-the-future-of-fintech-operations",
  "navigating-the-2026-google-search-algorithm-update-key-insights-for-digital-marketers",
  "leveraging-ubersuggest-for-multi-platform-keyword-strategy-in-digital-marketing",
  "leveraging-ai-visibility-reports-to-enhance-digital-marketing-strategies",
  "maximizing-insights-from-google-analytics-4-essential-reports-for-digital-marketers",
  "imperagen-s-5-million-seed-round-a-quantum-leap-in-enzyme-engineering-for-startups",
  "navigating-the-future-of-travel-payments-insights-from-scapia-s-63m-funding-round",
  "fresha-secures-80-million-investment-implications-for-beauty-and-wellness-startups",
  "maka-kids-pioneering-child-centric-streaming-solutions-for-startups",
  "nvidia-s-record-quarter-implications-for-ai-startups-and-investment-opportunities",
  "understanding-xai-s-financial-strategy-amid-spacex-s-ipo-implications-for-ai-investments",
  "anthropic-s-path-to-profitability-implications-for-ai-industry-stakeholders",
  "nvidia-s-strategic-shift-tapping-into-a-200-billion-ai-cpu-market",
  "leveraging-ai-in-aluminum-recycling-a-strategic-approach-for-startups",
  "navigating-google-s-ai-agent-ecosystem-implications-for-b2b-professionals",
  "hark-s-700m-series-a-implications-for-ai-integration-in-b2b-solutions",
  "evaluating-the-emergence-of-ai-therapy-solutions-safety-standards-and-market-potential",
  "leveraging-ai-for-audiobook-production-insights-from-spotify-s-new-tool",
  "leveraging-ai-powered-briefing-tools-for-enhanced-podcast-engagement",
  "implications-of-delayed-ai-security-executive-order-on-industry-standards",
  "what-happened-to-jen-hamilton-insights-on-her-recent-divorce-rumors",
  "remembering-gene-shalit-a-legacy-in-film-criticism",
  "usa-soccer-key-highlights-from-the-world-cup-opener-against-paraguay",
  "korea-vs-czechia-highlights-and-key-moments-from-the-match"
];

/** Approved voice samples — match this tone and reasoning, do not copy verbatim. */
export const OWNER_VOICE_APPROVED_SAMPLES = [
  "I would not treat AI startup-name tools like magic. They are useful, yes, but if you ask them for a name with no direction, most of what you get will sound like the same startup names everybody already skipped.",
  "AI can give you volume, but volume is not the same as a good name. A good name has to survive a few normal things: can you say it out loud, can someone remember it tomorrow, can you buy a domain close to it, and will you feel weird putting it on an invoice or a landing page?",
  "The best use of AI here is not 'pick my name.' The best use is 'give me directions I did not think about.'",
  "For example, if I was naming a tool that helps local businesses find competitor data, I would not only ask for names around 'leads' or 'maps.' I would ask for names around time-saving, local research, business lists, visibility, and maybe even boring words like directory or scout. Boring words are not always bad. Sometimes they tell the customer what the thing does.",
  "Then I would ask AI to generate different types of names: simple names, direct names, two-word names, names that sound like a tool, names that sound like a report, names for small business owners, not only tech people. This gives you a wider list. But again, most of it should be deleted.",
  "I would not open ChatGPT and type 'help me market my business.' That prompt is too empty. The tool will answer because that is what it does, but the answer will probably sound like a brochure for every business on the internet.",
  "I would not price a SaaS product by opening five competitor pages and averaging the numbers. That feels practical, but it skips the part that matters: what the customer thinks they are paying to stop doing."
];

/** Detector-passed article excerpts. Use as stronger style anchors for future rewrites. */
export const OWNER_VOICE_PASSED_ARTICLE_EXCERPTS = [
  `I would not open ChatGPT and type "help me market my business." That prompt is too empty. The tool will answer because that is what it does, but the answer will probably sound like a brochure for every business on the internet.

That is the trap. ChatGPT can write fast, but fast does not mean useful. A small business owner does not need ten shiny ideas that could apply to a gym, a bakery, a roofer, and a software company at the same time. You need something close enough to your real situation that you can use it without rewriting the whole thing.

The best use is not "run my business for me." The best use is "give me a rough first draft so I can think faster."`,
  `I would not price a SaaS product by opening five competitor pages and averaging the numbers. That feels practical, but it skips the part that matters: what the customer thinks they are paying to stop doing.

A SaaS price is not just a number on a pricing page. It is a small bet about the pain you remove. If the pain is tiny, the price has to be tiny or the customer will ignore it. If the pain is expensive, annoying, or tied to revenue, you have more room.

The best pricing work is not picking a clever tier name. It is figuring out why someone would pay this month and still feel okay paying again next month.`,
  `I would not build an AI company and treat the rules like paperwork for later. That sounds convenient, especially when the product is growing and everyone wants to ship the next feature. But later usually arrives at the worst time.

That is the part people miss. The risk is not only a fine or a bad headline. The risk is that customers stop believing you know what your own system is doing.

The best time to ask those questions is before the product becomes hard to change.`
];

/** LLM clichés and inflated vocabulary — high predictability / low perplexity signals. */
export const OWNER_VOICE_AI_VOCABULARY_AVOID = {
  openers: [
    "In today's fast-paced digital world",
    "Navigating the complex landscape of",
    "Let's dive in / delve into",
    "Whether you are a [audience] or a [audience]"
  ],
  connectors: [
    "It is important to note that",
    "Furthermore",
    "Moreover",
    "Additionally",
    "That being said",
    "Not only does it [X], but it also [Y]"
  ],
  verbs: [
    "leverage",
    "utilize",
    "harness",
    "foster",
    "streamline",
    "underscore",
    "unlock"
  ],
  adjectives: [
    "robust",
    "seamless",
    "pivotal",
    "dynamic",
    "multifaceted",
    "bespoke",
    "transformative"
  ],
  nouns: [
    "tapestry",
    "symphony",
    "testament",
    "beacon",
    "realm",
    "paradigm"
  ],
  closers: [
    "In conclusion",
    "Ultimately",
    "At the end of the day",
    "As we look to the future"
  ]
};

/** Writing rules derived from detector behavior: perplexity, burstiness, information gain. */
export const OWNER_VOICE_ANTI_AI_INSTRUCTIONS = [
  "Avoid statistically predictable word choices. Prefer plain, slightly unexpected phrasing over safe corporate transitions.",
  "Vary sentence length on purpose (burstiness): mix short blunt sentences with longer ones. Example rhythm: one longer sentence with commas, then a short one. Like this.",
  "Do not write every sentence in the same subject-verb-object shape. Break the rhythm with questions, fragments, or direct statements.",
  "Add information gain: include at least one specific named example, tool, platform, number, or first-hand scenario that generic summaries would skip.",
  "Add entity depth: mention concrete specifics for the topic (product names, metrics, workflows, customer types) instead of generic advice anyone could paste.",
  "Do not cover the same generic subtopics in the same order as every other article on the topic. Pick one angle and go deep on it.",
  "No summary closer. End on one sharp practical sentence, not a recap."
];

export const OWNER_VOICE_REWRITE_GUIDE = [
  "The owner voice is direct, practical, and a little skeptical. It often starts from a real question: do I actually need this, will it save time, is it worth paying for, and what problem does it solve?",
  "Open with a specific hook tied to the topic — a fact, a mistake you've seen, a direct answer, or a contrarian claim. Do not default every article to 'I would not treat X like magic' or the same skepticism opener.",
  "Use survival tests readers can apply: say it out loud, remember it tomorrow, buy a domain, feel okay putting it on an invoice or landing page.",
  "Reframe the job: 'The best use of AI is not X. The best use is Y' — give directions the reader did not think about, not a magic answer machine.",
  "Include concrete mini-scenarios with boring, practical words when useful. 'Directory' and 'scout' are not bad if they tell the customer what the thing does.",
  "When listing approaches, be opinionated: most AI output should be deleted; keep only names or ideas that pass normal business tests.",
  "Keep a human reasoning flow: personal observation, practical example, questions a business owner would ask, trade-offs, then a clear takeaway.",
  "Use simple business-owner logic around time, money, effort, marketing, tools, and whether something creates real value. Avoid sounding like a polished corporate blog.",
  "It is okay to include honest doubts and decision questions, but keep grammar clean enough for readers and search engines.",
  "Prefer concrete examples: AI agents, Google Business/Profile data, Google Maps research, APIs, paid tools, local businesses, small websites, referrals, ads, and manual work versus automation.",
  "Avoid generic AI hype. Make the article useful by explaining when a tool helps, when it does not, what can go wrong, and what the reader should check before spending time or money.",
  "Do not copy outside articles. Use the old article only as topic context and rebuild the body in an original Tech Revenue Brief voice.",
  "Avoid common AI article phrases like 'in today's digital landscape', 'game changer', 'unlock', 'leverage', 'seamlessly', 'robust', 'delve', 'landscape', 'crucial', and 'it depends' unless the wording is genuinely needed.",
  "Also avoid polished tutorial openings like 'isn't just a creative exercise', 'strategic move', 'with so many businesses vying for attention', 'enter AI tools', 'before diving in', and 'pitfalls to avoid'. These phrases are detector magnets.",
  "Do not use the same article skeleton every time. Vary the order based on the topic: sometimes start with a personal buying question, sometimes a mistake, sometimes a practical example.",
  "Use specific, slightly imperfect human phrasing where natural, but do not add fake typos. The goal is original thinking, not bad grammar.",
  "Include at least one concrete example or mini-scenario that was not in the old article.",
  "Avoid generic numbered workflows unless the topic truly needs numbered steps. If a list is needed, make each item opinionated and specific, not textbook instructions.",
  "Write as if the author has actually used tools, wasted time, compared options, and is warning a friend what to check before spending effort or money.",
  "Keep paragraphs short. Use ## headings that sound specific to the topic, not generic SEO headings.",
  "Use first person (I, my) when it adds judgment or experience. Do not force 'I would' or 'I would not' into every paragraph — vary rhythm and openings.",
  "For event-based topics (legal cases, funding, layoffs, launches): include concrete facts from the topic brief — names, dates, amounts, charges, status. Generic vertical advice alone is not enough.",
  "For advisory topics: each section needs a named tool, number, timeframe, or concrete example — not advice that could apply unchanged to any business.",
  "Do not use tutorial skeletons: no ## FAQ, no numbered step-by-step lists, no checkbox checklists, no 'Common Pitfalls to Avoid', no 'Here's how to' sections."
];

/** Short excerpt from the manually approved gold-standard article. Match this voice and structure. */
export const OWNER_VOICE_GOLD_ARTICLE_EXCERPT = `I would not treat AI startup-name tools like magic. They are useful, yes, but if you ask them for a name with no direction, most of what you get will sound like the same startup names everybody already skipped.

That is the issue. AI can give you volume, but volume is not the same as a good name. A good name has to survive a few normal things: can you say it out loud, can someone remember it tomorrow, can you buy a domain close to it, and will you feel weird putting it on an invoice or a landing page?

## Quick Answer

Use AI to generate a lot of startup name ideas, but do not let it choose for you. Give it clear words about what the business does, who it helps, and what feeling you want the name to have. Then remove anything that sounds too cute, too long, too hard to spell, or already taken.

## The mistake is asking AI for names too early

Most people open a tool and type something like "give me startup names for an app." The tool will respond, but what can it really do with that? It will guess.

Before I ask AI for names, I would write a small note first:

- What does the project actually do?
- Who is it for?

The best use of AI here is not "pick my name." The best use is "give me directions I did not think about."

But again, most of it should be deleted.`;

/** Phrases/structures that make articles score as generic AI — used to reject and retry rewrites. */
export const OWNER_VOICE_BANNED_PATTERNS: RegExp[] = [
  /\blet['']s break it down\b/i,
  /\bcommon pitfalls\b/i,
  /\bactionable steps?\b/i,
  /\bnavigating the\b/i,
  /\bleverag(e|ing)\b/i,
  /\bgame[- ]changer\b/i,
  /\bin today['']s digital\b/i,
  /\bsweet spot\b/i,
  /\bit['']s not just about\b/i,
  /\bhere['']s how to\b/i,
  /\bbefore diving in\b/i,
  /\benter AI\b/i,
  /\bstrategic move\b/i,
  /\bwith so many businesses\b/i,
  /\b##\s*FAQ\b/i,
  /\bchecklist for\b/i,
  /^\s*\d+\.\s+\*\*/m,
  /^\s*\[\s*\]/m,
  /\bas a small business owner, you might be wondering\b/i,
  /\bthis comprehensive guide\b/i,
  /\bin conclusion\b/i,
  /\bin the end\b/i,
  /\bkey takeaway(s)?:\b/i,
  /\bfinal thoughts\b/i,
  /^summary\b/im,
  /^##\s+summary\b/im,
  /\bunlock\b/i,
  /\bareas where\b/i,
  /\bpractical guide\b/i,
  /\brookie mistake\b/i,
  /\b##\s*conclusion\b/i,
  /\b##\s*takeaway\b/i,
  /^##\s+conclusion\b/im,
  /^##\s+final thoughts\b/im,
  /\bactionable insights?\b/i,
  /\brelevant and actionable\b/i,
  /\bsolid understanding of\b/i,
  /\bon the other hand\b/i,
  /\bthat cater to\b/i,
  /\bunique value proposition\b/i,
  /\bone[- ]size[- ]fits[- ]all\b/i,
  /\bpricing is more art than science\b/i,
  /\btest and iterate\b/i,
  /\bperceived value\b/i,
  /\bdynamic aspect\b/i,
  /\ballows? for growth\b/i,
  /\bcustomer segmentation matters\b/i,
  /\bunderstanding who your customers are is crucial\b/i,
  /\bthe truth is\b/i,
  /\blargely hinges\b/i,
  /\bnext to useless\b/i,
  /\bone of the biggest pitfalls\b/i,
  /\bthrowing a dart\b/i,
  /\bfor instance\b/i,
  /\bi recommend\b/i,
  /\bsome kind of oracle\b/i,
  /\bsure,\s/i,
  /\bhonestly,\s/i,
  /\bvaluable resource\b/i,
  /\bbrainstorming partner\b/i,
  /\bquality of (its|the) output\b/i,
  /\bspecific challenges\b/i,
  /\bfancy algorithms\b/i,
  /\bcheckbox for\b/i,
  /\bshiny algorithms\b/i,
  /\bregulatory landscape\b/i,
  /\bhouse on sand\b/i,
  /\bbig deal\b/i,
  /\bcatch you off guard\b/i,
  /\bvocal about\b/i,
  /\bnimble\b/i,
  /\bscrambling to keep up\b/i,
  /\btrip up\b/i,
  /\bas an afterthought\b/i,
  /\bcostly penalties\b/i,
  /\blost consumer trust\b/i,
  /\bi would advise\b/i,
  /\bdedicated compliance team\b/i,
  /\bnot glamorous\b/i,
  /\bengag(e|ing) with stakeholders\b/i,
  /\bnice-to-have\b/i,
  /\bbuilding trust\b/i,
  /\boffer insights\b/i,
  /\bcushion you against\b/i,
  /\blines of communication\b/i,
  /\bregulations? (is|are)n't just hurdles\b/i,
  /\bsignposts\b/i,
  /\bby aligning\b/i,
  /\bsustainable business model\b/i,
  /\bframework for growth\b/i,
  /\bin the AI game\b/i,
  /\bpour your resources\b/i,
  /\brisk management\b/i,
  /\bthe one that saves it\b/i,
  /\bin today['']s fast[- ]paced\b/i,
  /\bfast[- ]paced digital world\b/i,
  /\bcan be a good companion\b/i,
  /\bcan be an excellent\b/i,
  /\bcan be a great\b/i,
  /\bis often touted as\b/i,
  /\bgo-to for\b/i,
  /\boff the mark\b/i,
  /\bwithout falling apart\b/i,
  /\bwithout sacrificing quality\b/i,
  /\bin a factory setting\b/i,
  /\bcrucial in a\b/i,
  /\bwhich is crucial\b/i,
  /\bthey are reliable and efficient\b/i,
  /\bsound appealing\b/i,
  /\bjack-of-all-trades\b/i,
  /\bmaster of none\b/i,
  /\bthese are not just theoretical\b/i,
  /\bthe risks are real\b/i,
  /\band they could outweigh\b/i,
  /\bcan go a long way\b/i,
  /\bpull a fast one\b/i,
  /\bon its own devices\b/i,
  /\bto its own devices\b/i,
  /\bwithout proper guidance\b/i,
  /\bget past writer['']s block\b/i,
  /\bfinal drafts\b/i,
  /\bdo it better\b/i,
  /\bstand out\b/i,
  /\bget lost\b/i,
  /\broom for growth\b/i,
  /\bdifferentiate yourself\b/i,
  /\bcompelling reason for existing\b/i,
  /\bsaturated\b/i,
  /\bcompared to specialized\b/i,
  /\bcompared to traditional\b/i,
  /^##\s+.+\s+vs\s+.+$/im,
  /\bconsider these steps\b/i,
  /\bconsider the following\b/i,
  /\bhere are some steps\b/i,
  /\bfollow these steps\b/i,
  /\bthis helps \w+ navigate\b/i,
  /\bmore effectively\b/i,
  /\bthese are the questions\b/i,
  /\bthis determines whether\b/i,
  /\bit is important to note\b/i,
  /\bit is worth noting\b/i,
  /\bthis ensures that\b/i,
  /\bthis allows you to\b/i,
  /\bthis makes it easier\b/i,
  /\bby doing this\b/i,
  /\bin order to\b/i,
  /\bwhen it comes to\b/i,
  /\bas a result of\b/i,
  /\bdue to the fact\b/i,
  /\bin the event that\b/i,
  /\bit is essential\b/i,
  /\bit is crucial\b/i,
  /\bplays a crucial role\b/i,
  /\bplays an important role\b/i,
  /\btake the time to\b/i,
  /\bdo not hesitate to\b/i,
  /\bin essence\b/i,
  /\bat its core\b/i,
  /\bit['']s worth noting\b/i,
  /\bsimply put\b/i,
  /\bin short\b/i,
  /\bto be fair\b/i,
  /\blook,\s/i,
  /\bhere['']s the thing\b/i,
  /\bnavigate the\b/i,
  /\benter\s+(?:AI|automation|data|tool|platform|solution)\b/i,
  /\bwhat actually\b/i,
  /\bthe bottom line\b/i,
  /\btake note\b/i,
  /\bthe reality is\b/i,
  /\btruth be told\b/i,
  /\bneedless to say\b/i,
  /\bnot surprisingly\b/i,
  /\bas you might expect\b/i,
  /\bit goes without saying\b/i,
  /\bworth mentioning\b/i,
  /\bdon['']t forget that\b/i,
  /\bkeep in mind that\b/i,
  /\bas a result\b/i,
  /\bas we['']ve seen\b/i,
  /\bas mentioned\b/i,
  /\bas noted above\b/i,
  /\bcircle back\b/i,
  /\btouch base\b/i,
  /\bmoving forward\b/i,
  /\bgoing forward\b/i,
  /\bnavigating the complex landscape\b/i,
  /\blet['']s dive in\b/i,
  /\bdelve into\b/i,
  /\bwhether you are a\b/i,
  /\bit is important to note that\b/i,
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\badditionally\b/i,
  /\bthat being said\b/i,
  /\bnot only does it\b/i,
  /\bbut it also\b/i,
  /\bidentify\b/i,
  /\butilize\b/i,
  /\bimplement\b/i,
  /\bstrategies effectively\b/i,
  /\btailor your\b/i,
  /\boptimize\b/i,
  /\bharness\b/i,
  /\bfoster\b/i,
  /\bstreamline\b/i,
  /\bunderscore\b/i,
  /\brobust\b/i,
  /\bseamless\b/i,
  /\bpivotal\b/i,
  /\bmultifaceted\b/i,
  /\bbespoke\b/i,
  /\btransformative\b/i,
  /\btapestry\b/i,
  /\bsymphony\b/i,
  /\btestament\b/i,
  /\bbeacon\b/i,
  /\brealm\b/i,
  /\bparadigm\b/i,
  /\bultimately\b/i,
  /\bat the end of the day\b/i,
  /\bas we look to the future\b/i
];

export function detectOwnerVoiceTemplateSignals(content: string) {
  return OWNER_VOICE_BANNED_PATTERNS.filter((pattern) => pattern.test(content)).map(
    (pattern) => pattern.source
  );
}

export function detectCorporateTakeaways(takeaways: string[]) {
  const joined = takeaways.join(" ");
  const issues: string[] = [];

  if (/\b(identify|leverage|utilize|implement|strategies effectively|tailor your|optimize)\b/i.test(joined)) {
    issues.push("corporate key_takeaways wording");
  }

  if (takeaways.some((item) => item.trim().length < 20)) {
    issues.push("key_takeaways too short to be specific");
  }

  return issues;
}

function bodySentences(content: string) {
  return content
    .replace(/^##\s+.+$/gm, "")
    .match(/[^.!?]+[.!?]+/g) ?? [];
}

export function detectSubjectRepetition(content: string) {
  const sentences = bodySentences(content);
  let consecutiveSubjectMatches = 0;

  for (let i = 1; i < sentences.length; i += 1) {
    const prevFirstWord = sentences[i - 1]?.trim().split(/\s+/)[0]?.toLowerCase();
    const currFirstWord = sentences[i]?.trim().split(/\s+/)[0]?.toLowerCase();

    if (
      prevFirstWord &&
      currFirstWord &&
      prevFirstWord === currFirstWord &&
      prevFirstWord.length > 3
    ) {
      consecutiveSubjectMatches += 1;
    }
  }

  return consecutiveSubjectMatches >= 2
    ? [
        "SUBJECT_REPETITION: Same subject starts 3+ consecutive sentences. Rewrite to vary sentence openings."
      ]
    : [];
}

export function detectSelfJustifyingSentences(content: string) {
  const selfJustifyPattern =
    /[.!?]\s+(This|It|That) (means|makes|helps|allows|ensures|shows|demonstrates|proves|can|will|would) (it |you |your |the )/gi;
  const selfJustifyMatches = content.match(selfJustifyPattern) ?? [];

  return selfJustifyMatches.length >= 3
    ? [
        "SELF_JUSTIFY: Too many self-explaining sentences (This makes it... It helps you... That ensures...). Cut the explanation — the point already made itself."
      ]
    : [];
}

function sentenceWordCounts(content: string) {
  return content
    .replace(/^##\s+.+$/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 3)
    .map((sentence) => sentence.split(/\s+/).length);
}

/** AI text tends toward uniform medium-length sentences. Humans mix short and long. */
export function detectLowBurstiness(content: string) {
  const counts = sentenceWordCounts(content);
  const issues: string[] = [];

  if (counts.length < 5) {
    return issues;
  }

  const shortCount = counts.filter((count) => count <= 7).length;
  const longCount = counts.filter((count) => count >= 20).length;
  const average =
    counts.reduce((sum, count) => sum + count, 0) / counts.length;
  const variance =
    counts.reduce((sum, count) => sum + (count - average) ** 2, 0) /
    counts.length;

  if (shortCount < 2) {
    issues.push("low burstiness: add more short sentences");
  }

  if (longCount < 1) {
    issues.push("low burstiness: add at least one longer sentence");
  }

  if (variance < 20) {
    issues.push("low burstiness: sentence lengths too uniform");
  }

  return issues;
}

export function stripGeneratedSourceFooter(content: string) {
  return content
    .replace(
      /\n{0,2}(?:\*\*)?Source(?: Attribution)?(?:\*\*)?:[^\n]*(?:\n\s*(?:Read more|Visit|Original source):[^\n]*)?/gi,
      ""
    )
    .replace(
      /\n{0,2}##\s+(?:Related on Tech Revenue Brief|Tools mentioned in this guide|Useful tools for this trend)\b[\s\S]*?(?=\n##\s+|\s*$)/gi,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
