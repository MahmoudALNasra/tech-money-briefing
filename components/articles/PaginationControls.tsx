import Link from "next/link";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

function pageHref(basePath: string, page: number) {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

export function PaginationControls({
  currentPage,
  totalPages,
  basePath,
  hasPreviousPage,
  hasNextPage
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-[3px] border border-white/[0.06] bg-[var(--bg-surface)] px-5 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--border-accent)] hover:bg-[var(--bg-elevated)]";
  const disabledClass =
    "inline-flex min-h-11 items-center justify-center rounded-[3px] border border-white/[0.06] bg-[var(--bg-elevated)] px-5 text-sm font-bold text-[var(--text-dim)]";

  return (
    <nav
      aria-label="Article pagination"
      className="flex items-center justify-between gap-4 pt-8"
    >
      {hasPreviousPage ? (
        <Link
          href={pageHref(basePath, currentPage - 1)}
          rel="prev"
          className={linkClass}
        >
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Previous
        </span>
      )}

      <span className="text-sm font-semibold text-[var(--text-muted)]">
        Page {currentPage} of {totalPages}
      </span>

      {hasNextPage ? (
        <Link
          href={pageHref(basePath, currentPage + 1)}
          rel="next"
          className={linkClass}
        >
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Next
        </span>
      )}
    </nav>
  );
}
