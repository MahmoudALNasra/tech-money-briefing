import Link from "next/link";
import type { ReactNode } from "react";

const CALLOUT_PREFIX = /^>>\s+/;

function normalizeInlineHeadingLists(line: string) {
  const headingListMatch = line.match(/^(#{2,4}\s+.+?)\s+(-\s+.+)$/);

  if (!headingListMatch) {
    return line;
  }

  const heading = headingListMatch[1].trim();
  const listText = headingListMatch[2].trim();
  const items = listText
    .replace(/^-\s+/, "")
    .split(/\s+-\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return line;
  }

  return `${heading}\n\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function normalizeArticleContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\\(#{2,4})\s+/g, "\n\n$1 ")
    .replace(/\\([#*_`=])/g, "$1")
    .split("\n")
    .map((line) => normalizeInlineHeadingLists(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderTextSegment(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let partIndex = 0;
  const combined = new RegExp(
    `(\\*\\*[^*]+\\*\\*|==[^=]+==|\\[[^\\]]+\\]\\((?:https?:\\/\\/|\\/)[^)]+\\))`,
    "g"
  );
  let match: RegExpExecArray | null;

  while ((match = combined.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${partIndex}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-extrabold text-ink">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("==") && token.endsWith("==")) {
      nodes.push(
        <mark
          key={key}
          className="rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-950"
        >
          {token.slice(2, -2)}
        </mark>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)$/);

      if (linkMatch) {
        if (linkMatch[2].startsWith("/")) {
          nodes.push(
            <Link key={key} href={linkMatch[2]} className="font-semibold underline">
              {linkMatch[1]}
            </Link>
          );
        } else {
          nodes.push(
            <a
              key={key}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              {linkMatch[1]}
            </a>
          );
        }
      } else {
        nodes.push(token);
      }
    }

    cursor = match.index + token.length;
    partIndex += 1;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

export function renderInlineContent(text: string) {
  return renderTextSegment(text, "inline");
}

export function headingId(text: string) {
  return text
    .replace(/[\p{Extended_Pictographic}]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getContentHeadings(blocks: string[]) {
  return blocks
    .map((block) => {
      const match = block.match(/^(#{2,4})\s+(.+)$/);

      if (!match) {
        return null;
      }

      const label = match[2].replace(/\*\*/g, "").trim();

      return {
        id: headingId(label),
        label,
        level: match[1].length
      };
    })
    .filter((heading): heading is { id: string; label: string; level: number } =>
      Boolean(heading?.id && heading.label)
    )
    .slice(0, 8);
}

function CalloutBlock({ children }: { children: ReactNode }) {
  return (
    <aside className="not-prose my-6 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">
        Highlight
      </p>
      <div className="mt-3 text-base font-semibold leading-7 text-stone-800">
        {children}
      </div>
    </aside>
  );
}

export function renderArticleBlock(block: string) {
  const headingMatch = block.match(/^(#{2,4})\s+(.+)$/);

  if (headingMatch) {
    const label = headingMatch[2].trim();
    const id = headingId(label);

    if (headingMatch[1].length >= 3) {
      return (
        <h3 key={block} id={id} className="text-ink">
          {renderInlineContent(label)}
        </h3>
      );
    }

    return (
      <h2 key={block} id={id} className="text-ink">
        {renderInlineContent(label)}
      </h2>
    );
  }

  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

  if (lines.length === 1 && CALLOUT_PREFIX.test(lines[0])) {
    return (
      <CalloutBlock key={block}>
        {renderInlineContent(lines[0].replace(CALLOUT_PREFIX, ""))}
      </CalloutBlock>
    );
  }

  const isUnorderedList =
    lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));
  const isOrderedList =
    lines.length > 1 && lines.every((line) => /^\d+\.\s+/.test(line));

  if (isUnorderedList || isOrderedList) {
    const ListTag = isOrderedList ? "ol" : "ul";

    return (
      <ListTag key={block} className="marker:text-emerald-600">
        {lines.map((line) => (
          <li key={line} className="pl-1">
            {renderInlineContent(line.replace(/^([-*]|\d+\.)\s+/, ""))}
          </li>
        ))}
      </ListTag>
    );
  }

  return <p key={block}>{renderInlineContent(block)}</p>;
}
