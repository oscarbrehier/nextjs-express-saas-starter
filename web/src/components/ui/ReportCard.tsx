interface ReportCardProps {
  title: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * The shell every report in the product shares: a printed-sheet surface,
 * a ruled header carrying the record's title and a monospaced meta line,
 * and an optional ruled footer. Repos, the profile summary, billing plans,
 * and account fields all read from this one instrument.
 */
export function ReportCard({ title, meta, children, footer, className = "" }: ReportCardProps) {
  return (
    <article
      className={`rounded-[3px] border border-rule bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${className}`}
    >
      <header className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-3.5">
        <h3 className="min-w-0 truncate text-sm font-semibold text-ink">{title}</h3>
        {meta && (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-muted">
            {meta}
          </span>
        )}
      </header>

      {children && <div className="px-5 py-4">{children}</div>}

      {footer && <footer className="border-t border-rule px-5 py-3">{footer}</footer>}
    </article>
  );
}
