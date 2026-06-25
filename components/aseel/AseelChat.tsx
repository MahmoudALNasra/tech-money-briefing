"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { pickRandomAseelCaption } from "@/components/aseel/aseel-captions";
import {
  ASEEL_WELCOME_MESSAGE,
  loadAseelChatMessages,
  loadAseelUserMessageCount,
  saveAseelChatMessages,
  saveAseelUserMessageCount,
  type AseelStoredMessage
} from "@/components/aseel/aseel-chat-storage";
import {
  isVisualSurprise,
  pickSurpriseEffect,
  playSurpriseSound,
  readLastVisit,
  shouldPlayAseelIntro,
  SURPRISE_EMOJIS,
  type AseelSurpriseEffect,
  unlockAseelAudio,
  writeLastVisit
} from "@/components/aseel/aseel-effects";
import { AseelIntroSplash } from "@/components/aseel/AseelIntroSplash";

type ChatMessage = AseelStoredMessage;

const WELCOME = ASEEL_WELCOME_MESSAGE;

const SURPRISE_AFTER_USER_MSG = 5;
const SURPRISE_DURATION_MS = 700;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function surpriseClass(effect: AseelSurpriseEffect | null) {
  if (!effect || !isVisualSurprise(effect)) {
    return "";
  }

  if (effect === "shake") {
    return "aseel-surprise-shake";
  }

  if (effect === "wobble") {
    return "aseel-surprise-wobble";
  }

  if (effect === "bounce") {
    return "aseel-surprise-bounce";
  }

  if (effect === "spin") {
    return "aseel-surprise-spin";
  }

  return "";
}

export function AseelChat() {
  const [headerCaption] = useState(() => pickRandomAseelCaption());
  const [introCaption] = useState(() => pickRandomAseelCaption());
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [chatHydrated, setChatHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSurprise, setActiveSurprise] = useState<AseelSurpriseEffect | null>(
    null
  );
  const [emojiRain, setEmojiRain] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const userMessageCountRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastVisit = readLastVisit();
    const playIntro = shouldPlayAseelIntro(lastVisit);
    setShowIntro(playIntro);
    writeLastVisit();

    const storedMessages = loadAseelChatMessages();
    setMessages(storedMessages);
    userMessageCountRef.current = loadAseelUserMessageCount();
    setChatHydrated(true);
  }, []);

  useEffect(() => {
    if (!chatHydrated) {
      return;
    }

    saveAseelChatMessages(messages);
  }, [chatHydrated, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const triggerSurprise = useCallback(() => {
    const effect = pickSurpriseEffect();

    if (effect === "emoji-rain") {
      setEmojiRain(
        Array.from({ length: 14 }, () =>
          SURPRISE_EMOJIS[Math.floor(Math.random() * SURPRISE_EMOJIS.length)]!
        )
      );
      window.setTimeout(() => setEmojiRain([]), 1900);
    } else if (effect === "flash") {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 550);
    } else if (isVisualSurprise(effect)) {
      setActiveSurprise(effect);
      window.setTimeout(() => setActiveSurprise(null), SURPRISE_DURATION_MS);
    }

    if (
      effect === "sound-pop" ||
      effect === "sound-boop" ||
      effect === "sound-slide"
    ) {
      playSurpriseSound(effect);
    } else if (Math.random() > 0.45) {
      playSurpriseSound(
        (["sound-pop", "sound-boop", "sound-slide"] as const)[
          Math.floor(Math.random() * 3)
        ]!
      );
    }
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || loading) {
      return;
    }

    unlockAseelAudio();

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

    userMessageCountRef.current += 1;
    saveAseelUserMessageCount(userMessageCountRef.current);

    if (userMessageCountRef.current > SURPRISE_AFTER_USER_MSG) {
      triggerSurprise();
    }

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

  if (showIntro === null) {
    return <div className="min-h-[100dvh] bg-[#120818]" />;
  }

  return (
    <>
      {showIntro ? (
        <AseelIntroSplash
          caption={introCaption}
          onDone={() => setShowIntro(false)}
        />
      ) : null}

      <div
        ref={rootRef}
        className={`flex min-h-[100dvh] flex-col bg-[#120818] text-white ${surpriseClass(activeSurprise)}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-10 h-56 w-56 rounded-full bg-fuchsia-600/25 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -right-16 top-32 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl sm:top-40 sm:h-80 sm:w-80" />
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-rose-500/15 blur-3xl sm:left-1/3 sm:h-64 sm:w-64" />
        </div>

        {flash ? (
          <div className="aseel-flash-overlay pointer-events-none absolute inset-0 z-40 bg-fuchsia-400/35" />
        ) : null}

        {emojiRain.length > 0 ? (
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {emojiRain.map((emoji, index) => (
              <span
                key={`${emoji}-${index}`}
                className="aseel-emoji-fall absolute text-2xl"
                style={{
                  left: `${6 + ((index * 13) % 88)}%`,
                  top: "-8%",
                  ["--drift" as string]: `${(index % 2 === 0 ? -1 : 1) * (12 + (index % 5) * 8)}px`
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        ) : null}

        <header className="aseel-header relative z-10 border-b border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-5">
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            ركن أسيل
          </h1>
          <p
            key={headerCaption}
            className="aseel-msg-in mt-1.5 text-sm leading-6 text-white/60"
          >
            {headerCaption}
          </p>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-8 sm:py-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:gap-4">
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`aseel-msg-in flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[15px] leading-7 shadow-lg sm:max-w-[88%] ${
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
          className="relative z-10 border-t border-white/10 bg-[#120818]/90 px-3 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-4"
        >
          <div className="mx-auto flex max-w-2xl items-end gap-2 sm:gap-3">
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
              placeholder="اكتبي شو بدك…"
              className="max-h-28 min-h-[48px] flex-1 resize-none rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-base text-white placeholder:text-white/35 focus:border-fuchsia-400/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
              disabled={loading}
              enterKeyHint="send"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="min-h-[48px] shrink-0 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-3 text-sm font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
