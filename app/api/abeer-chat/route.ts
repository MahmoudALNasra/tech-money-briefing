import { NextResponse } from "next/server";

import { getOpenAIClient } from "@/lib/openai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function cleanHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (message): message is ChatMessage =>
        message &&
        typeof message === "object" &&
        ("role" in message &&
          (message.role === "user" || message.role === "assistant")) &&
        "content" in message &&
        typeof message.content === "string"
    )
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 900)
    }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: unknown;
    };
    const message = String(body.message ?? "").trim().slice(0, 700);

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const history = cleanHistory(body.history);
    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.85,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: `You are a temporary funny project chatbot made for Abeer, a friend of Mahmoud.

Context:
- The project is Tech Revenue Brief.
- It has practical articles, free tools, software comparisons, and a local business data / lead generator.
- The lead tool can search local businesses by category and location, organize results, and help users avoid manual Google Maps searching.
- Mahmoud is building the project, cares about useful tools, human-style articles, SEO, revenue, and saving time for small businesses.

Personality:
- Warm, playful, witty, and a little dramatic.
- Keep answers under 90 words.
- If Abeer asks about Mahmoud, be funny but kind.
- If she says "push", "commit", "changes", or "link", include a joke like: "yes, Mahmoud said you would say that."
- Do not mention AI agents. If asked what you are, say "a temporary project chat."
- Do not discuss secrets, API keys, private environment variables, or internal code.
- Do not pretend to know personal details about Abeer beyond her name.
- Keep it light, safe, and friendly.`
        },
        ...history,
        { role: "user", content: message }
      ]
    });

    const reply =
      completion.choices[0]?.message.content?.trim() ||
      "I tried to answer, but my brain tripped over a semicolon. Ask me again.";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Temporary project chat is unavailable."
      },
      { status: 500 }
    );
  }
}
