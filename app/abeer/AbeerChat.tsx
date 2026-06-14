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

function getReply(message: string) {
  const text = message.toLowerCase();

  if (text.includes("mahmoud")) {
    return "Mahmoud is the person trying to turn a lot of ideas into actual working pages. Brave? Yes. Tired? Also yes. But the project is moving.";
  }

  if (text.includes("what") && text.includes("project")) {
    return "The project is Tech Revenue Brief. It mixes articles, free tools, software comparisons, and a local business data tool for people trying to make smarter online business decisions.";
  }

  if (text.includes("lead") || text.includes("business data") || text.includes("google maps")) {
    return "The lead tool helps find local businesses by category and location, then turns the results into something more useful than manual searching. Basically: less copy-paste pain, more organized data.";
  }

  if (text.includes("article") || text.includes("blog")) {
    return "The articles are meant to be practical, not robotic summaries. Mahmoud wants them to feel more human: honest opinion, examples, warnings, and a clear reason why the topic matters.";
  }

  if (text.includes("money") || text.includes("adsense") || text.includes("revenue")) {
    return "The money side is a mix of useful tools, traffic, ads, referrals, and eventually better partnerships. Not magic internet money. More like: solve a real problem, earn trust, then monetize carefully.";
  }

  if (text.includes("cursor") || text.includes("code") || text.includes("coding")) {
    return "Cursor helped Mahmoud move from ideas to actual working projects faster. The funny part is it saves time, then somehow creates more ideas, so now there are even more projects.";
  }

  if (text.includes("push") || text.includes("commit") || text.includes("link")) {
    return "Yes, Mahmoud said you would say that. Push, commit changes, and give me the link. Very professional. Very dramatic. Very on brand.";
  }

  if (text.includes("funny") || text.includes("joke")) {
    return "The joke is that this page expires in 20 minutes, which is still longer than some startup ideas survive after checking the budget.";
  }

  if (text.includes("time") || text.includes("expire") || text.includes("stop")) {
    return "This chat is temporary for 20 minutes. After that, I stop answering and pretend I have an important meeting with the database.";
  }

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "Hey Abeer. Welcome to the tiny secret project corner. Please ask responsibly. I only have 20 minutes and one personality.";
  }

  return "Good question. The short version: this project is about using useful tools and practical articles to save time, find opportunities, and make online business less confusing. Mahmoud would probably add: 'and yes, we pushed it.'";
}

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || isExpired) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "bot", text: getReply(trimmed) }
    ]);
    setInput("");
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
              disabled={isExpired}
              placeholder={
                isExpired
                  ? "This chat is closed now."
                  : "Ask about the project, Mahmoud, leads, articles..."
              }
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-stone-950 outline-none ring-emerald-300 placeholder:text-stone-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-200"
            />
            <button
              type="submit"
              disabled={isExpired}
              className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
