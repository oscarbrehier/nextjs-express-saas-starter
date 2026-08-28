import Link from "next/link";

const REDACTION_WIDTHS = [72, 55, 84, 40, 60];

/**
 * What a free-tier repo's metric panel shows instead of a blur-and-CTA:
 * the report exists but its body is redacted, stamped SEALED rather than
 * hidden — the free/pro boundary stays legible as a real document state.
 */
export function SealedPanel() {
  return (
    <div className="relative select-none">
      <div className="space-y-2.5" aria-hidden="true">
        {REDACTION_WIDTHS.map((w, i) => (
          <div key={i} className="h-2.5 rounded-[1px] bg-ink-muted/20" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link
          href="/billing"
          className="-rotate-3 inline-flex items-center gap-2 border-2 border-accent bg-surface/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent transition-transform hover:rotate-0"
        >
          Sealed — Unlock Pro
        </Link>
      </div>
    </div>
  );
}
