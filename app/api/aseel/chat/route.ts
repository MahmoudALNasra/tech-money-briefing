import { NextResponse } from "next/server";

import {
  ASEEL_CHAT_MAX_HISTORY,
  ASEEL_CHAT_MAX_MESSAGE,
  buildAseelSystemPrompt,
  type AseelChatMessage
} from "@/lib/aseel-chat";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: AseelChatMessage[];
    };

    const message = String(body.message ?? "").trim().slice(0, ASEEL_CHAT_MAX_MESSAGE);

    if (!message) {
      return NextResponse.json({ error: "Say something first." }, { status: 400 });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (entry) =>
              entry &&
              (entry.role === "user" || entry.role === "assistant") &&
              typeof entry.content === "string"
          )
          .slice(-ASEEL_CHAT_MAX_HISTORY)
      : [];

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.92,
      max_tokens: 220,
      messages: [
        { role: "system", content: buildAseelSystemPrompt() },
        ...history.map((entry) => ({
          role: entry.role as "user" | "assistant",
          content: entry.content.slice(0, ASEEL_CHAT_MAX_MESSAGE)
        })),
        { role: "user", content: message }
      ]
    });

    const reply =
      completion.choices[0]?.message.content?.trim() ||
      "والله فاتتني هالجملة — جربي تاني؟";

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Chat unavailable right now."
      },
      { status: 500 }
    );
  }
}
