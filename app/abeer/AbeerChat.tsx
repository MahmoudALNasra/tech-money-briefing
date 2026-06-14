"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

const SESSION_KEY = "abeer-project-chat-started-at";
const SESSION_LENGTH_MS = 20 * 60 * 1000;

const introMessages: ChatMessage[] = [
  {
    role: "bot",
    text: "Hi Abeer. I am the temporary project chat. Mahmoud said you might ask smart questions, so I stretched first."
  },
  {
    role: "bot",
    text: "You can ask me about the project, the lead tool, the articles, the website, or why Mahmoud keeps saying 'push and commit changes' like it is a life motto."
  }
];

function formatRemaining(ms: number) {
  const safeMs = Math.max(0, ms);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function AbeerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(introMessages);
  const [input, setInput] = useState("");
  const [remainingMs, setRemainingMs] = useState(SESSION_LENGTH_MS);
  const [isExpired, setIsExpired] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const expiresAt = useMemo(() => {
    if (typeof window === "undefined") {
      return Date.now() + SESSION_LENGTH_MS;
    }

    const existingStart = Number(window.localStorage.getItem(SESSION_KEY));
    const startedAt = Number.isFinite(existingStart) && existingStart > 0 ? existingStart : Date.now();
    window.localStorage.setItem(SESSION_KEY, String(startedAt));

    return startedAt + SESSION_LENGTH_MS;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextRemaining = expiresAt - Date.now();
      setRemainingMs(nextRemaining);
      setIsExpired(nextRemaining <= 0);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || isExpired || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text: trimmed }
    ];

    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/abeer-chat", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8).map((message) => ({
            role: message.role === "bot" ? "assistant" : "user",
            content: message.text
          }))
        })
      });
      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Chat unavailable.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text:
            data.reply ||
            "I had a thought, then it ran away. Very rude. Ask me again."
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: "My live brain is unavailable for a second. Mahmoud probably forgot to feed the server coffee. Try again."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-950 via-emerald-950 to-stone-900 px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
        <header className="border-b border-white/10 bg-white/10 px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                Temporary Project Chat
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Hi Abeer, ask me anything.
              </h1>
            </div>
            <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-100">
              {isExpired ? "Expired" : formatRemaining(remainingMs)}
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-200">
            This page is only here for a quick chat. After 20 minutes, it stops
            answering and goes back to pretending it is a serious website.
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-5 py-3 text-sm leading-6 shadow-lg ${
                  message.role === "user"
                    ? "bg-emerald-300 text-stone-950"
                    : "bg-white text-stone-900"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isExpired ? (
            <div className="rounded-3xl border border-red-300/30 bg-red-500/15 p-5 text-sm font-semibold leading-6 text-red-100">
              Time is up. Mahmoud said 20 minutes, and for once the deadline was respected.
            </div>
          ) : null}
          {isSending ? (
            <div className="flex justify-start">
              <div className="rounded-3xl bg-white px-5 py-3 text-sm font-black leading-6 text-stone-900 shadow-lg">
                Thinking of something funny...
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-white/10 bg-stone-950/40 p-4 sm:p-5"
        >
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isExpired || isSending}
              placeholder={
                isExpired
                  ? "This chat is closed now."
                  : "Ask about the project, Mahmoud, leads, articles..."
              }
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-stone-950 outline-none ring-emerald-300 placeholder:text-stone-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-200"
            />
            <button
              type="submit"
              disabled={isExpired || isSending}
              className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isSending ? "Wait" : "Send"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
