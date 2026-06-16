"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useDataLayer } from "@/hooks/useDataLayer";

type AssistantContext = "tool" | "article" | "home";

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
    "Can I build a competitor lead list from this?",
    "Which related tool should I use next?",
    "How do I turn this into a publishable page?"
  ],
  article: [
    "Summarize this into an action plan.",
    "Which tools should I use next?",
    "I need help with this. How do I contact you?"
  ],
  home: [
    "I need more traffic. Where do I start?",
    "Which free tool should I run first?",
    "I want help choosing the right path."
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
          : context === "home"
            ? "Hi. Tell me if you need traffic, revenue, or a tool decision — I'll point you to the best next click on Tech Revenue Brief."
            : `Hi. I can help you use **${resolvedTitle}** and suggest next tools on Tech Revenue Brief. What are you trying to publish or monetize?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [isLoading, isOpen, messages]);

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
          pageType: context === "home" ? "home" : context,
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
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Assistant failed.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: json.reply ?? "No response." }
      ]);
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
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          pushToDataLayer({
            event: "tool_assistant_open",
            tool_href: resolvedHref,
            assistant_context: context,
            assistant_open: nextOpen
          });
        }}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-[80] flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 px-4 text-white shadow-2xl shadow-indigo-900/25 ring-1 ring-white/40 transition hover:scale-105 hover:shadow-indigo-900/35 sm:right-6 md:bottom-[calc(env(safe-area-inset-bottom)+7rem)] ${
          isOpen ? "scale-95" : "motion-safe:animate-bounce"
        }`}
        aria-label={isOpen ? "Close tool assistant" : "Open tool assistant"}
        aria-expanded={isOpen}
      >
        <span
          aria-hidden="true"
          className={`absolute -top-[5.6rem] right-1 grid h-24 w-20 place-items-center transition duration-300 ${
            isOpen
              ? "-translate-y-1 rotate-3 scale-95"
              : "motion-safe:animate-bounce"
          }`}
        >
          <span className="absolute inset-x-2 bottom-1 h-10 rounded-full bg-emerald-300/30 blur-xl" />
          <span className="absolute right-3 top-6 z-10 h-3 w-3 rounded-full bg-lime-300 ring-2 ring-white motion-safe:animate-pulse" />
          <Image
            src="/assistant-mascot-body.svg"
            alt=""
            width={90}
            height={120}
            className="relative h-24 w-20 object-contain"
          />
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xl leading-none text-white">
          {isOpen ? "×" : "✦"}
        </span>
        <span className="text-sm font-black">
          {isOpen ? "Close" : "Ask AI"}
        </span>
        {!isOpen ? (
          <span className="pointer-events-none absolute -top-[4.5rem] right-[5.5rem] hidden whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-black text-ink shadow-lg shadow-stone-950/10 sm:block">
            Need a next step?
          </span>
        ) : null}
        <span className="sr-only">
          {isOpen ? "Close assistant" : "Open assistant"}
        </span>
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[80] flex h-[min(82dvh,42rem)] flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl shadow-stone-950/25 sm:inset-x-auto sm:right-6 sm:w-[min(100vw-3rem,460px)] md:bottom-[calc(env(safe-area-inset-bottom)+7rem)]"
          role="dialog"
          aria-label="Tool assistant"
        >
          <div className="flex items-center gap-3 border-b border-stone-200 bg-gradient-to-r from-indigo-600 to-emerald-600 px-5 py-4 pr-14 text-white">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-indigo-950/20">
              <Image
                src="/assistant-mascot.svg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                {context === "article"
                  ? "Article guide"
                  : context === "home"
                    ? "Home guide"
                    : "Site guide"}
              </p>
              <p className="mt-1 font-black">{resolvedTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl font-black text-white transition hover:bg-white/25"
              aria-label="Minimize assistant"
            >
              ×
            </button>
          </div>

          <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold leading-5 text-emerald-950">
                Need competitor businesses, pins, and an enriched Excel report?
              </p>
              <Link
                href="/leads?source=ai_cat_assistant"
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-800"
              >
                Open paid report
              </Link>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
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
            <div ref={messagesEndRef} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  pushToDataLayer({
                    event: "tool_assistant_prompt_click",
                    tool_href: resolvedHref,
                    assistant_context: context,
                    prompt
                  });
                  void sendMessage(prompt);
                }}
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
