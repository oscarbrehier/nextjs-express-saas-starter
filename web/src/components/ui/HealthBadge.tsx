const STAGES = [
  { min: 85, label: "Mature" },
  { min: 65, label: "Established" },
  { min: 40, label: "Developing" },
  { min: 0, label: "Early stage" },
] as const;

function stageFor(score: number) {
  return STAGES.find((s) => score >= s.min) ?? STAGES[STAGES.length - 1];
}

interface HealthBadgeProps {
  score: number;
  size?: "md" | "lg";
}

/**
 * Plain informational readout for the total health score — a bordered
 * cell, not a verdict. No color judgment: the number and stage describe
 * where a repo is, not whether that's good or bad.
 */
export function HealthBadge({ score, size = "md" }: HealthBadgeProps) {
  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  const stage = stageFor(rounded);
  const dims = size === "lg" ? "h-28 w-28" : "h-20 w-20";
  const scoreSize = size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center border border-rule ${dims}`}
      role="img"
      aria-label={`Health reading: ${stage.label}, score ${rounded} of 100`}
    >
      <span className={`font-mono font-bold leading-none text-ink ${scoreSize}`}>{rounded}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-ink-muted">
        {stage.label}
      </span>
    </div>
  );
}
