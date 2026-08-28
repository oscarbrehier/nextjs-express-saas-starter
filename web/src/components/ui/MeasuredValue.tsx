interface MeasuredValueProps {
  label: string;
  value: number;
  max: number;
}

/**
 * One row of a report's metric panel: a label, a reference-range bracket
 * with the current reading marked against it, and the raw value/max in
 * tabular figures. Purely informational — a low reading is a fact, not a
 * fault, so the bracket never recolors to signal good or bad.
 */
export function MeasuredValue({ label, value, max }: MeasuredValueProps) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-ink-muted sm:w-36 sm:text-sm">
        {label}
      </span>

      <div className="relative h-4 flex-1" role="img" aria-label={`${label}: ${Math.round(value)} of ${max}`}>
        <span className="absolute inset-y-0 left-0 w-px bg-rule" aria-hidden="true" />
        <span className="absolute inset-y-0 right-0 w-px bg-rule" aria-hidden="true" />
        <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-rule" aria-hidden="true" />
        <span
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-ink-muted"
          style={{ left: 0, width: `${pct * 100}%` }}
          aria-hidden="true"
        />
        <span
          className="absolute inset-y-0 w-px bg-ink"
          style={{ left: `${pct * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums sm:text-sm text-ink">
        {Math.round(value)}/{max}
      </span>
    </div>
  );
}
