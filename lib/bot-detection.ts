/**
 * Heuristic bot/crawler detection from User-Agent strings.
 * Used to keep first-party analytics closer to human traffic.
 */

const BOT_UA_PATTERN =
  /bot\b|crawler|spider|crawling|slurp|archiver|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|twitterbot|pinterest|embedly|quora link preview|googlebot|google-inspectiontool|storebot-google|bingbot|yandex|baiduspider|duckduckbot|applebot|petalbot|semrush|ahrefs|mj12bot|dotbot|rogerbot|screaming frog|uptimerobot|pingdom|statuscake|headlesschrome|phantomjs|selenium|puppeteer|playwright|lighthouse|pagespeed|prerender|preview|gptbot|claudebot|anthropic|bytespider|ccbot|amazonbot|meta-externalagent|ia_archiver|wget|curl\/|python-requests|go-http-client|java\/|libwww|httpclient|apache-httpclient|node-fetch|postmanruntime/i;

/** User agents that look like normal browsers despite containing "bot" elsewhere. */
const ALLOWLIST_PATTERN =
  /mediapartners-google|chrome-lighthouse|google-read-aloud/i;

export function isLikelyBotUserAgent(userAgent: string | null | undefined) {
  if (!userAgent || userAgent.trim().length < 12) {
    return true;
  }

  const normalized = userAgent.trim();

  if (ALLOWLIST_PATTERN.test(normalized)) {
    return false;
  }

  return BOT_UA_PATTERN.test(normalized);
}
