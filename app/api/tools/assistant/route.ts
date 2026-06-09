import { NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/openai";
import { FREE_TOOLS } from "@/lib/free-tools";
import { getRecommendedToolsForText } from "@/lib/tool-recommendations";
import { getRelatedTools, getToolPageSeo } from "@/lib/tool-pages";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

function buildToolCatalog() {
  return FREE_TOOLS.map((tool) => ({
    href: tool.href,
    title: tool.title,
    description: tool.description
  }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      toolHref?: string;
      toolTitle?: string;
      pageType?: "tool" | "article" | "home";
      pageHref?: string;
      pageTitle?: string;
      pageSummary?: string;
      category?: string;
      history?: AssistantMessage[];
    };

    const message = String(body.message ?? "").trim().slice(0, 2000);
    const pageType =
      body.pageType === "article"
        ? "article"
        : body.pageType === "home"
          ? "home"
          : "tool";
    const toolHref = String(body.toolHref ?? "").trim();
    const toolTitle = String(body.toolTitle ?? "").trim();
    const pageHref = String(body.pageHref ?? toolHref ?? "/tools").trim();
    const pageTitle = String(body.pageTitle ?? toolTitle ?? "").trim();
    const pageSummary = String(body.pageSummary ?? "").trim().slice(0, 1200);
    const category = String(body.category ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const seo = toolHref ? getToolPageSeo(toolHref) : undefined;
    const related =
      pageType === "article" || pageType === "home"
        ? getRecommendedToolsForText(
            [pageTitle, pageSummary, category].join(" "),
            6,
            true
          )
        : toolHref
          ? getRelatedTools(toolHref, 6)
          : [];
    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (entry) =>
              entry &&
              (entry.role === "user" || entry.role === "assistant") &&
              typeof entry.content === "string"
          )
          .slice(-6)
      : [];

    const systemPrompt = `You are the Tech Revenue Brief site guide - a concise assistant for founders, publishers, and marketers using techrevenuebrief.com.

Rules:
- Stay on topic: SEO, content, monetization, articles, tools on this site, and practical next steps.
- Keep answers under 120 words unless the user asks for detail.
- Recommend specific on-site tools with markdown links like [Blog title generator](/blog-title-generator).
- If the user cannot find what they need, needs hands-on help, wants a custom strategy, asks about consulting, or asks how to reach us, send them to [Contact](/contact) and tell them the form goes to sales@techrevenuebrief.com.
- For article pages, explain the article in plain language, turn it into an action plan, and suggest relevant tools.
- For the homepage, route visitors to traffic tools (/keyword-cluster-tool, /serp-intent-analyzer), revenue tools (/adsense-revenue-calculator, /monetization-audit), or comparisons (/compare) based on their goal.
- Never promise revenue, rankings, or AdSense approval.
- Never ask for or reveal API keys or secrets.
- If unsure, suggest running a related tool or the monetization audit at /monetization-audit.

Current page type: ${pageType}
Current page: ${pageTitle || toolTitle || "Tools hub"} (${pageHref || toolHref || "/tools"})
${pageSummary ? `Page summary: ${pageSummary}` : ""}
${category ? `Category: ${category}` : ""}
${seo ? `Primary keyword: ${seo.primaryKeyword}. Problem solved: ${seo.problem}` : ""}
Related tools: ${related.map((t) => `${t.title} (${t.href})`).join("; ")}

Available tools catalog (sample): ${JSON.stringify(buildToolCatalog().slice(0, 12))}`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((entry) => ({
          role: entry.role as "user" | "assistant",
          content: entry.content.slice(0, 1500)
        })),
        { role: "user", content: message }
      ]
    });

    const reply =
      completion.choices[0]?.message.content?.trim() ||
      "I could not generate a response. Try asking about your next SEO or monetization step.";

    return NextResponse.json({
      reply,
      suggestedTools: related.slice(0, 3).map((t) => ({
        href: t.href,
        title: t.title
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Assistant unavailable."
      },
      { status: 500 }
    );
  }
}
