"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "هلا يا Aseel 👋\n\nSecret page, zero judgment. Ask about Mahmoud, the website he won't shut up about, or literally anything else — I'll keep it funny, not a lecture."
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AseelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const history = nextMessages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({
          role: message.role,
          content: message.content
        }));

      const response = await fetch("/api/aseel/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history
        })
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Something broke.");
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: data.reply ?? "…"
        }
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not send."
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#120818] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-rose-500/15 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 px-5 py-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-200/80">
          private · just for fun
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Aseel&apos;s corner
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
          A tiny chat bot with opinions — Jordanian Arabic welcome, English fine
          too. Mahmoud built this on the side of a whole media site. No index,
          no menu, no stress.
        </p>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[15px] leading-7 shadow-lg ${
                    isUser
                      ? "rounded-br-md bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white"
                      : "rounded-bl-md border border-white/10 bg-white/8 text-white/92 backdrop-blur-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-md border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/70 backdrop-blur-sm">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce [animation-delay:120ms]">•</span>
                  <span className="animate-bounce [animation-delay:240ms]">•</span>
                </span>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-center text-sm text-rose-300">{error}</p>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 border-t border-white/10 bg-[#120818]/90 px-4 py-4 backdrop-blur-md sm:px-8"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit(event);
              }
            }}
            rows={1}
            placeholder="اكتبي شو بدك… or type in English"
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:border-fuchsia-400/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
