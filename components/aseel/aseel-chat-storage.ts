export type AseelStoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MESSAGES_KEY = "aseel-chat-messages";
const USER_MSG_COUNT_KEY = "aseel-chat-user-count";
const MAX_STORED_MESSAGES = 80;

export const ASEEL_WELCOME_MESSAGE: AseelStoredMessage = {
  id: "welcome",
  role: "assistant",
  content: "هلا يا أسيل 👋\n\nيلا احكي — بضحك، بعربي، وبز English. مش محاضرة."
};

function isStoredMessage(value: unknown): value is AseelStoredMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    (row.role === "user" || row.role === "assistant") &&
    typeof row.content === "string" &&
    row.content.trim().length > 0
  );
}

export function loadAseelChatMessages(): AseelStoredMessage[] {
  if (typeof window === "undefined") {
    return [ASEEL_WELCOME_MESSAGE];
  }

  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);

    if (!raw) {
      return [ASEEL_WELCOME_MESSAGE];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [ASEEL_WELCOME_MESSAGE];
    }

    const messages = parsed.filter(isStoredMessage).slice(-MAX_STORED_MESSAGES);

    if (messages.length === 0) {
      return [ASEEL_WELCOME_MESSAGE];
    }

    const hasWelcome = messages.some((message) => message.id === "welcome");

    return hasWelcome ? messages : [ASEEL_WELCOME_MESSAGE, ...messages];
  } catch {
    return [ASEEL_WELCOME_MESSAGE];
  }
}

export function saveAseelChatMessages(messages: AseelStoredMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = messages.slice(-MAX_STORED_MESSAGES);

  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmed));
}

export function loadAseelUserMessageCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(USER_MSG_COUNT_KEY);
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function saveAseelUserMessageCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_MSG_COUNT_KEY, String(Math.max(0, count)));
}

export function clearAseelChatHistory() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MESSAGES_KEY);
  window.localStorage.removeItem(USER_MSG_COUNT_KEY);
}
