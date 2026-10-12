import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export const OPENAI_DISABLED_MESSAGE =
  "OpenAI is disabled. Set OPENAI_ENABLED=true to turn it back on.";

export function isOpenAIEnabled() {
  return process.env.OPENAI_ENABLED === "true";
}

export function getOpenAIClient(): OpenAI {
  if (!isOpenAIEnabled()) {
    throw new Error(OPENAI_DISABLED_MESSAGE);
  }

  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
