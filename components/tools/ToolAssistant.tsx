"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

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

type AnchorPosition = {
  x: number;
  y: number;
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

const POSITION_STORAGE_KEY = "trb-assistant-anchor-v2";
const DRAG_THRESHOLD_PX = 6;
const DEFAULT_BOTTOM_REM = 6;
const DEFAULT_RIGHT_PX = 16;
const DEFAULT_LEFT_PX = 16;
const MOBILE_BREAKPOINT = 768;
const FRAME_WIDTH = 148;
const FRAME_HEIGHT = 156;
const PANEL_MAX_WIDTH = 460;
const PANEL_MAX_HEIGHT = 672;
const PANEL_MIN_HEIGHT = 220;
const VIEWPORT_MARGIN = 12;

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

function getDefaultBottomOffsetPx() {
  const safeBottom = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "env(safe-area-inset-bottom)"
    ) || "0"
  );

  return safeBottom + DEFAULT_BOTTOM_REM * 16;
}

function getDefaultAnchorPosition(): AnchorPosition {
  const bottomOffset = getDefaultBottomOffsetPx();
  const y = window.innerHeight - FRAME_HEIGHT - bottomOffset;

  if (isMobileViewport()) {
    return clampAnchorPosition(DEFAULT_LEFT_PX, y);
  }

  const x = window.innerWidth - FRAME_WIDTH - DEFAULT_RIGHT_PX;
  return clampAnchorPosition(x, y);
}

function computePanelStyle(anchor: AnchorPosition): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const mobile = viewportWidth < MOBILE_BREAKPOINT;
  const panelWidth = Math.min(PANEL_MAX_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
  const preferredHeight = Math.min(viewportHeight * 0.82, PANEL_MAX_HEIGHT);

  if (mobile) {
    const spaceAbove = anchor.y - VIEWPORT_MARGIN;
    const spaceBelow =
      viewportHeight - anchor.y - FRAME_HEIGHT - VIEWPORT_MARGIN;
    const openAbove = spaceAbove >= spaceBelow;
    const availableSpace = openAbove ? spaceAbove - 8 : spaceBelow - 8;
    let panelHeight = Math.min(preferredHeight, availableSpace);

    if (panelHeight < PANEL_MIN_HEIGHT) {
      const top = VIEWPORT_MARGIN;
      const bottom = Math.max(
        VIEWPORT_MARGIN,
        viewportHeight - anchor.y - FRAME_HEIGHT - 8
      );
      panelHeight = Math.min(preferredHeight, viewportHeight - top - bottom);

      if (panelHeight < PANEL_MIN_HEIGHT) {
        return {
          left: VIEWPORT_MARGIN,
          right: VIEWPORT_MARGIN,
          top,
          bottom: `calc(env(safe-area-inset-bottom) + ${VIEWPORT_MARGIN}px)`,
          width: "auto",
          height: "auto",
          maxHeight: "none"
        };
      }

      return {
        left: VIEWPORT_MARGIN,
        right: VIEWPORT_MARGIN,
        top,
        bottom,
        width: "auto",
        height: panelHeight,
        maxHeight: panelHeight
      };
    }

    if (openAbove) {
      return {
        left: VIEWPORT_MARGIN,
        right: VIEWPORT_MARGIN,
        bottom: viewportHeight - anchor.y + 8,
        top: "auto",
        width: "auto",
        height: panelHeight,
        maxHeight: panelHeight
      };
    }

    return {
      left: VIEWPORT_MARGIN,
      right: VIEWPORT_MARGIN,
      top: anchor.y + FRAME_HEIGHT + 8,
      bottom: "auto",
      width: "auto",
      height: panelHeight,
      maxHeight: panelHeight
    };
  }

  return {
    left: Math.min(
      Math.max(VIEWPORT_MARGIN, anchor.x),
      Math.max(VIEWPORT_MARGIN, viewportWidth - panelWidth - VIEWPORT_MARGIN)
    ),
    right: "auto",
    bottom: Math.max(VIEWPORT_MARGIN, viewportHeight - anchor.y + 12),
    width: panelWidth,
    maxHeight: preferredHeight
  };
}

function clampAnchorPosition(
  x: number,
  y: number,
  width = FRAME_WIDTH,
  height = FRAME_HEIGHT
): AnchorPosition {
  const margin = 8;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);

  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY)
  };
}

function applyAnchorPosition(element: HTMLElement, position: AnchorPosition) {
  element.style.left = `${position.x}px`;
  element.style.top = `${position.y}px`;
  element.style.right = "auto";
  element.style.bottom = "auto";
}

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
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelInlineStyle, setPanelInlineStyle] = useState<CSSProperties>();
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const livePositionRef = useRef<AnchorPosition | null>(null);
  const dragFrameRef = useRef(0);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    startedOnTrigger: false
  });
  const pushToDataLayer = useDataLayer();

  useEffect(() => {
    function syncViewportMode() {
      setIsMobile(isMobileViewport());
    }

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);
    return () => window.removeEventListener("resize", syncViewportMode);
  }, []);

  useEffect(() => {
    let hasSavedPosition = false;

    try {
      const saved =
        window.localStorage.getItem(POSITION_STORAGE_KEY) ??
        window.localStorage.getItem("trb-assistant-anchor-v1");

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AnchorPosition>;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const next = clampAnchorPosition(parsed.x, parsed.y);
          setAnchorPosition(next);
          livePositionRef.current = next;
          hasSavedPosition = true;
        }
      }
    } catch {
      // Ignore invalid saved positions.
    }

    if (!hasSavedPosition) {
      const next = getDefaultAnchorPosition();
      setAnchorPosition(next);
      livePositionRef.current = next;
    }
  }, []);

  useEffect(() => {
    if (!anchorPosition || !anchorRef.current) {
      return;
    }

    applyAnchorPosition(anchorRef.current, anchorPosition);
    livePositionRef.current = anchorPosition;
  }, [anchorPosition]);

  const persistAnchorPosition = useCallback((position: AnchorPosition) => {
    livePositionRef.current = position;
    setAnchorPosition(position);
    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  }, []);

  const readAnchorPosition = useCallback((): AnchorPosition | null => {
    if (livePositionRef.current) {
      return livePositionRef.current;
    }

    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return { x: rect.left, y: rect.top };
  }, []);

  const clampToViewport = useCallback((x: number, y: number) => {
    const rect = anchorRef.current?.getBoundingClientRect();
    const width = rect?.width ?? FRAME_WIDTH;
    const height = rect?.height ?? FRAME_HEIGHT;
    return clampAnchorPosition(x, y, width, height);
  }, []);

  const scheduleDragPosition = useCallback(
    (x: number, y: number) => {
      const next = clampToViewport(x, y);
      livePositionRef.current = next;

      if (dragFrameRef.current) {
        return;
      }

      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = 0;
        const element = anchorRef.current;
        const position = livePositionRef.current;

        if (element && position) {
          applyAnchorPosition(element, position);
        }
      });
    },
    [clampToViewport]
  );

  useEffect(() => {
    if (!anchorPosition) {
      return;
    }

    function handleResize() {
      const current = livePositionRef.current ?? anchorPosition;
      if (!current) {
        return;
      }

      const next = clampToViewport(current.x, current.y);
      persistAnchorPosition(next);
      if (anchorRef.current) {
        applyAnchorPosition(anchorRef.current, next);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [anchorPosition, clampToViewport, persistAnchorPosition]);

  useEffect(() => {
    if (!anchorPosition || !isOpen) {
      setPanelInlineStyle(undefined);
      return;
    }

    function updatePanelStyle() {
      if (!anchorPosition) {
        return;
      }

      setPanelInlineStyle(computePanelStyle(anchorPosition));
    }

    updatePanelStyle();
    window.addEventListener("resize", updatePanelStyle);
    return () => window.removeEventListener("resize", updatePanelStyle);
  }, [anchorPosition, isOpen]);

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

  useEffect(() => {
    return () => {
      if (dragFrameRef.current) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, []);

  const toggleAssistant = useCallback(() => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    pushToDataLayer({
      event: "tool_assistant_open",
      tool_href: resolvedHref,
      assistant_context: context,
      assistant_open: nextOpen
    });
  }, [context, isOpen, pushToDataLayer, resolvedHref]);

  const handleFramePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const current = readAnchorPosition();
    if (!current || !anchorRef.current) {
      return;
    }

    applyAnchorPosition(anchorRef.current, current);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
      startedOnTrigger: triggerRef.current?.contains(event.target as Node) ?? false
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handleFramePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
      return;
    }

    if (!dragState.moved) {
      dragState.moved = true;
      setIsDragging(true);
    }

    scheduleDragPosition(dragState.originX + deltaX, dragState.originY + deltaY);
    event.preventDefault();
  };

  const finishFramePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (dragState.moved) {
      const position = livePositionRef.current;
      if (position) {
        persistAnchorPosition(position);
      }
    } else if (dragState.startedOnTrigger) {
      toggleAssistant();
    }

    dragStateRef.current.pointerId = -1;
    dragStateRef.current.moved = false;
    dragStateRef.current.startedOnTrigger = false;
    setIsDragging(false);
  };

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

  const anchorStyle: CSSProperties = anchorPosition
    ? { left: anchorPosition.x, top: anchorPosition.y, right: "auto", bottom: "auto" }
    : isMobile
      ? {
          left: DEFAULT_LEFT_PX,
          bottom: `calc(env(safe-area-inset-bottom) + ${DEFAULT_BOTTOM_REM}rem)`,
          right: "auto",
          top: "auto"
        }
      : {
          right: DEFAULT_RIGHT_PX,
          bottom: `calc(env(safe-area-inset-bottom) + ${DEFAULT_BOTTOM_REM}rem)`,
          left: "auto",
          top: "auto"
        };

  const defaultPanelStyle: CSSProperties = isMobile
    ? {
        left: VIEWPORT_MARGIN,
        right: VIEWPORT_MARGIN,
        bottom: `calc(env(safe-area-inset-bottom) + ${DEFAULT_BOTTOM_REM}rem + ${FRAME_HEIGHT}px)`
      }
    : {
        bottom: `calc(env(safe-area-inset-bottom) + ${DEFAULT_BOTTOM_REM}rem)`,
        right: DEFAULT_RIGHT_PX
      };

  const panelUsesComputedHeight = Boolean(
    panelInlineStyle?.height || panelInlineStyle?.maxHeight === "none"
  );

  return (
    <>
      <div
        ref={anchorRef}
        className={`fixed z-[80] touch-none select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          ...anchorStyle,
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          WebkitTouchCallout: "none"
        }}
        onPointerDown={handleFramePointerDown}
        onPointerMove={handleFramePointerMove}
        onPointerUp={finishFramePointer}
        onPointerCancel={finishFramePointer}
      >
        <div className="relative h-full w-full">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[2rem]"
          />

          <div
            aria-hidden="true"
            className={`pointer-events-none absolute right-0 top-0 grid h-24 w-20 place-items-center ${
              isOpen
                ? "-translate-y-1 rotate-3 scale-95 transition duration-200"
                : isDragging
                  ? "scale-[0.98] transition-none"
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
              draggable={false}
              className="relative h-24 w-20 object-contain"
            />
          </div>

          <button
            ref={triggerRef}
            type="button"
            className={`absolute bottom-0 right-0 flex h-14 min-w-[8.75rem] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 px-4 text-white shadow-2xl shadow-indigo-900/25 ring-1 ring-white/40 ${
              isOpen
                ? "scale-95 transition duration-200"
                : isDragging
                  ? "scale-100 transition-none"
                  : "motion-safe:animate-bounce transition hover:scale-105 hover:shadow-indigo-900/35"
            }`}
            aria-label={isOpen ? "Close tool assistant" : "Open tool assistant"}
            aria-expanded={isOpen}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xl leading-none text-white">
              {isOpen ? "×" : "✦"}
            </span>
            <span className="text-sm font-black">{isOpen ? "Close" : "Ask AI"}</span>
            {!isOpen ? (
              <span className="pointer-events-none absolute -top-[4.5rem] right-[5.5rem] hidden whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-black text-ink shadow-lg shadow-stone-950/10 sm:block">
                Drag me out of the way
              </span>
            ) : null}
            <span className="sr-only">
              {isOpen
                ? "Close assistant"
                : "Tap to open assistant. Drag anywhere on the cat to move."}
            </span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          ref={panelRef}
          className={`fixed z-[80] flex flex-col overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-2xl shadow-stone-950/25 sm:inset-x-auto sm:w-[min(100vw-3rem,460px)] md:bottom-[calc(env(safe-area-inset-bottom)+7rem)] ${
            panelUsesComputedHeight ? "min-h-0" : "h-[min(82dvh,42rem)]"
          } ${isMobile ? "" : "inset-x-3"}`}
          style={panelInlineStyle ?? defaultPanelStyle}
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
