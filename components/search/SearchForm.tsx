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
        className={`min-w-0 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-ink outline-none transition placeholder:text-stone-400 focus:border-ink focus:bg-white ${
          compact ? "w-48 lg:w-56" : "w-full"
        }`}
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-700"
      >
        Search
      </button>
    </form>
  );
}
