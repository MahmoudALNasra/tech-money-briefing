"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useDataLayer } from "@/hooks/useDataLayer";

type AssistantContext = "tool" | "article";

type ToolAssistantProps = {
  toolHref?: string;
  toolTitle?: string;
  context?: AssistantContext;
  pageHref?: string;
  pageTitle?: string;
  pageSummary?: string;
  category?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterPromptsByContext: Record<AssistantContext, string[]> = {
  tool: [
    "What should I do after running this tool?",
    "Which related tool should I use next?",
    "How do I turn this into a publishable page?"
  ],
  article: [
    "Summarize this into an action plan.",
    "Which tools should I use next?",
    "I need help with this. How do I contact you?"
  ]
};

export function ToolAssistant({
  toolHref,
  toolTitle,
  context = "tool",
  pageHref,
  pageTitle,
  pageSummary,
  category
}: ToolAssistantProps) {
  const resolvedHref = pageHref ?? toolHref ?? "/tools";
  const resolvedTitle = pageTitle ?? toolTitle ?? "Tech Revenue Brief";
  const starterPrompts = starterPromptsByContext[context];
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        context === "article"
          ? `Hi. I can explain **${resolvedTitle}**, turn it into next steps, recommend tools, or help you contact us if you need hands-on help.`
          : `Hi. I can help you use **${resolvedTitle}** and suggest next tools on Tech Revenue Brief. What are you trying to publish or monetize?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTools, setSuggestedTools] = useState<
    Array<{ href: string; title: string }>
  >([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const pushToDataLayer = useDataLayer();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed }
    ];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    pushToDataLayer({
      event: "tool_assistant_message",
      tool_href: resolvedHref,
      assistant_context: context
    });

    try {
      const response = await fetch("/api/tools/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          toolHref,
          toolTitle,
          pageType: context,
          pageHref: resolvedHref,
          pageTitle: resolvedTitle,
          pageSummary,
          category,
          history: nextMessages.slice(-6)
        })
      });

      const json = (await response.json()) as {
        reply?: string;
        error?: string;
        suggestedTools?: Array<{ href: string; title: string }>;
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Assistant failed.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: json.reply ?? "No response." }
      ]);
      setSuggestedTools(json.suggestedTools ?? []);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Try again or browse /tools."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          pushToDataLayer({
            event: "tool_assistant_open",
            tool_href: resolvedHref,
            assistant_context: context
          });
        }}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 text-2xl text-white shadow-xl shadow-indigo-900/25 transition hover:scale-105 hover:shadow-2xl ${
          isOpen ? "scale-95" : "motion-safe:animate-bounce"
        }`}
        aria-label={isOpen ? "Close tool assistant" : "Open tool assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? "×" : "✦"}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 z-40 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl shadow-stone-950/20"
          role="dialog"
          aria-label="Tool assistant"
        >
          <div className="border-b border-stone-200 bg-gradient-to-r from-indigo-600 to-emerald-600 px-5 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              {context === "article" ? "Article guide" : "Site guide"}
            </p>
            <p className="mt-1 font-black">{resolvedTitle}</p>
          </div>

          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "user"
                    ? "ml-8 bg-ink text-white"
                    : "mr-4 bg-stone-100 text-stone-800"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading ? (
              <p className="text-xs font-semibold text-stone-400">Thinking...</p>
            ) : null}
          </div>

          {suggestedTools.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-2">
              {suggestedTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs font-bold text-ink transition hover:border-ink"
                  onClick={() => setIsOpen(false)}
                >
                  {tool.title}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-100"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-stone-200 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about next steps..."
              disabled={isLoading}
              className="min-h-11 flex-1 rounded-full border border-stone-200 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
