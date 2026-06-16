"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SearchFormProps = {
  compact?: boolean;
  initialQuery?: string;
  onSearch?: () => void;
  placeholder?: string;
};

export function SearchForm({
  compact = false,
  initialQuery = "",
  onSearch,
  placeholder = "Search briefings and tools"
}: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search");
      onSearch?.();
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    onSearch?.();
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={compact ? "flex min-w-0 items-center gap-2" : "flex w-full items-center gap-2"}
    >
      <label className="sr-only" htmlFor={compact ? "site-search-compact" : "site-search"}>
        Search
      </label>
      <input
        id={compact ? "site-search-compact" : "site-search"}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={`min-w-0 rounded-[3px] border border-white/[0.06] bg-white/[0.03] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-[var(--border-accent)] focus:bg-[var(--bg-elevated)] ${
          compact ? "w-48 lg:w-56" : "w-full"
        }`}
      />
      <button
        type="submit"
        className="shrink-0 rounded-[3px] bg-[var(--accent-blue)] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--bg-base)] transition hover:bg-[#7dd3fc]"
      >
        Search
      </button>
    </form>
  );
}
