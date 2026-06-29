import Link from "next/link";
import type { ReactNode } from "react";

import {
  canUseAutoLink,
  getBaseAutoLinkRules,
  recordAutoLink,
  type ArticleAutoLinkBudget,
  type AutoLinkRule
} from "@/lib/article-auto-links";

const CALLOUT_PREFIX = /^>>\s+/;

function normalizeArticleHref(href: string) {
  if (href.startsWith("/")) {
    return href;
  }

  try {
    const url = new URL(href);

    if (/^(www\.)?example\.com$/i.test(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    return href;
  }

  return href;
}

function renderAutoLinkedText(
  text: string,
  keyPrefix: string,
  rules: AutoLinkRule[],
  options?: ArticleRenderOptions
) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let linkIndex = 0;
  const budget = options?.autoLinkBudget;

  while (cursor < text.length) {
    const rest = text.slice(cursor);
    let best:
      | {
          rule: AutoLinkRule;
          index: number;
          text: string;
        }
      | null = null;

    for (const rule of rules) {
      if (budget && !canUseAutoLink(budget, rule.href)) {
        continue;
      }

      const match = rest.match(rule.pattern);

      if (!match || match.index === undefined) {
        continue;
      }

      if (
        !best ||
        match.index < best.index ||
        (match.index === best.index &&
          (match[0].length > best.text.length ||
            (match[0].length === best.text.length && rule.priority > best.rule.priority)))
      ) {
        best = { rule, index: match.index, text: match[0] };
      }
    }

    if (!best) {
      nodes.push(rest);
      break;
    }

    if (best.index > 0) {
      nodes.push(rest.slice(0, best.index));
    }

    const href = best.rule.href;
    const key = `${keyPrefix}-auto-${linkIndex}`;

    if (href.startsWith("/")) {
      nodes.push(
        <Link key={key} href={href} className="font-semibold underline">
          {best.text}
        </Link>
      );
    } else {
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          {best.text}
        </a>
      );
    }

    if (budget) {
      recordAutoLink(budget, href);
    }

    cursor += best.index + best.text.length;
    linkIndex += 1;
  }

  return nodes;
}

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

function normalizeChecklistLine(line: string) {
  return line.replace(/^([-*])\s+(\[[ xX]\]\s+)/, "$2");
}

function normalizeInlineChecklists(line: string) {
  if (/\s-\s+\[[ xX]\]\s+/.test(line) && !/^(?:[-*]\s+)?\[[ xX]\]\s+/.test(line)) {
    return line
      .split(/\s+-\s+(?=\[[ xX]\]\s+)/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => normalizeChecklistLine(item))
      .join("\n");
  }

  return normalizeChecklistLine(line);
}

function normalizeInlineHeadingChecklists(line: string) {
  const headingChecklistMatch = line.match(/^(#{2,4}\s+.+?)\s+(\[[ xX]\]\s+.+)$/);

  if (!headingChecklistMatch) {
    return line;
  }

  const heading = headingChecklistMatch[1].trim();
  const checklistText = headingChecklistMatch[2].trim();
  const items = checklistText
    .split(/\s+-\s+(?=\[[ xX]\]\s+)/)
    .map((item) => normalizeChecklistLine(item.trim()))
    .filter(Boolean);

  if (items.length === 0) {
    return line;
  }

  return `${heading}\n\n${items.join("\n")}`;
}

function normalizeArticleLine(line: string) {
  return normalizeInlineChecklists(
    normalizeInlineHeadingChecklists(normalizeInlineHeadingLists(line.trim()))
  );
}

export function isChecklistLine(line: string) {
  return /^(?:[-*]\s+)?\[[ xX]\]\s+/.test(line);
}

function checklistLabel(line: string) {
  return line.replace(/^(?:[-*]\s+)?\[[ xX]\]\s+/, "");
}

function isChecklistChecked(line: string) {
  return /^(?:[-*]\s+)?\[[xX]\]\s+/.test(line);
}

export function normalizeArticleContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\\(#{2,4})\s+/g, "\n\n$1 ")
    .replace(/\\([#*_`=])/g, "$1")
    .split("\n")
    .map((line) => normalizeArticleLine(line))
    .join("\n")
    .replace(/(^|\n)(#{2,4}\s+[^\n]+)\n(?!\n)/g, "$1$2\n\n")
    .replace(/^\*\*Meta Description:\*\*.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resolveAutoLinkRules(options?: ArticleRenderOptions) {
  return options?.autoLinkRules ?? getBaseAutoLinkRules();
}

function renderTextSegment(text: string, keyPrefix: string, options?: ArticleRenderOptions) {
  const rules = resolveAutoLinkRules(options);
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
      nodes.push(
        ...renderAutoLinkedText(
          text.slice(cursor, match.index),
          `${keyPrefix}-plain-${partIndex}`,
          rules,
          options
        )
      );
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
        const href = normalizeArticleHref(linkMatch[2]);

        if (href.startsWith("/")) {
          nodes.push(
            <Link key={key} href={href} className="font-semibold underline">
              {linkMatch[1]}
            </Link>
          );
        } else {
          nodes.push(
            <a
              key={key}
              href={href}
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
    nodes.push(
      ...renderAutoLinkedText(text.slice(cursor), `${keyPrefix}-plain-end`, rules, options)
    );
  }

  return nodes;
}

export type ArticleRenderOptions = {
  autoLinkRules?: AutoLinkRule[];
  autoLinkBudget?: ArticleAutoLinkBudget;
};

export function renderInlineContent(text: string, options?: ArticleRenderOptions) {
  return renderTextSegment(text, "inline", options);
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

function splitMarkdownTableRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isMarkdownTableDividerCell(cell: string) {
  return /^:?-{3,}:?$/.test(cell.replace(/\s+/g, ""));
}

function parseMarkdownTable(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3 || !lines[0].includes("|")) {
    return null;
  }

  const headers = splitMarkdownTableRow(lines[0]);
  const divider = splitMarkdownTableRow(lines[1]);

  if (
    headers.length === 0 ||
    divider.length < headers.length ||
    !divider.slice(0, headers.length).every((cell) => isMarkdownTableDividerCell(cell))
  ) {
    return null;
  }

  const rows = lines
    .slice(2)
    .filter((line) => line.includes("|"))
    .map((line) => splitMarkdownTableRow(line))
    .map((cells) => {
      if (cells.length < headers.length) {
        return [...cells, ...Array(headers.length - cells.length).fill("")];
      }

      return cells.slice(0, headers.length);
    });

  if (rows.length === 0) {
    return null;
  }

  return { headers, rows };
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

export function renderArticleBlock(block: string, options?: ArticleRenderOptions) {
  const headingMatch = block.match(/^(#{2,4})\s+(.+)$/);

  if (headingMatch) {
    const label = headingMatch[2].trim();
    const id = headingId(label);

    if (headingMatch[1].length >= 3) {
      return (
        <h3 key={block} id={id} className="text-ink">
          {renderInlineContent(label, options)}
        </h3>
      );
    }

    return (
      <h2 key={block} id={id} className="text-ink">
        {renderInlineContent(label, options)}
      </h2>
    );
  }

  const headingWithBodyMatch = block.match(/^(#{2,4})\s+([^\n]+)\n+([\s\S]+)$/);

  if (headingWithBodyMatch) {
    const headingBlock = `${headingWithBodyMatch[1]} ${headingWithBodyMatch[2]}`;
    const bodyBlocks = headingWithBodyMatch[3]
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    return (
      <div key={block} className="contents">
        {renderArticleBlock(headingBlock, options)}
        {bodyBlocks.map((bodyBlock) => renderArticleBlock(bodyBlock, options))}
      </div>
    );
  }

  const markdownTable = parseMarkdownTable(block);

  if (markdownTable) {
    return (
      <div
        key={block}
        className="not-prose my-8 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[var(--bg-surface)]"
      >
        <table className="min-w-full border-collapse text-sm text-[var(--text-primary)]">
          <thead className="bg-white/[0.06]">
            <tr>
              {markdownTable.headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="border-b border-white/[0.08] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]"
                >
                  {renderInlineContent(header, options)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markdownTable.rows.map((row, rowIndex) => (
              <tr key={`${block}-row-${rowIndex}`} className="odd:bg-white/[0.01]">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${block}-row-${rowIndex}-cell-${cellIndex}`}
                    className="border-b border-white/[0.04] px-4 py-3 align-top text-sm leading-6 text-[var(--text-muted)]"
                  >
                    {renderInlineContent(cell, options)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

  if (lines.length === 1 && CALLOUT_PREFIX.test(lines[0])) {
    return (
      <CalloutBlock key={block}>
        {renderInlineContent(lines[0].replace(CALLOUT_PREFIX, ""), options)}
      </CalloutBlock>
    );
  }

  const isUnorderedList =
    lines.length > 1 &&
    lines.every((line) => /^[-*]\s+/.test(line)) &&
    !lines.every((line) => isChecklistLine(line));
  const isOrderedList =
    lines.length > 1 && lines.every((line) => /^\d+\.\s+/.test(line));
  const isChecklist =
    lines.length > 1 && lines.every((line) => isChecklistLine(line));
  const hasChecklistTitle =
    lines.length > 1 &&
    !isChecklistLine(lines[0]) &&
    lines.slice(1).every((line) => isChecklistLine(line));

  if (hasChecklistTitle || isChecklist) {
    const title = hasChecklistTitle ? lines[0] : null;
    const checklistLines = hasChecklistTitle ? lines.slice(1) : lines;

    return (
      <div key={block} className="not-prose my-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        {title ? (
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
            {renderInlineContent(title, options)}
          </p>
        ) : null}
        <ul className={title ? "mt-3 space-y-2" : "space-y-2"}>
          {checklistLines.map((line) => {
            const checked = isChecklistChecked(line);
            const label = checklistLabel(line);

            return (
              <li key={line} className="flex gap-3 text-sm font-semibold leading-6 text-stone-800">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs ${
                    checked
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-emerald-300 bg-white text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{renderInlineContent(label, options)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (isUnorderedList || isOrderedList) {
    const ListTag = isOrderedList ? "ol" : "ul";

    return (
      <ListTag key={block} className="marker:text-emerald-600">
        {lines.map((line) => (
          <li key={line} className="pl-1">
            {renderInlineContent(line.replace(/^([-*]|\d+\.)\s+/, ""), options)}
          </li>
        ))}
      </ListTag>
    );
  }

  return <p key={block}>{renderInlineContent(block, options)}</p>;
}
