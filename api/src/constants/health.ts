/**
 * Weights for the repo health score, out of 100. Single source of truth —
 * both the scorer (services/github.ts) and the PDF report template
 * (utils/reportTemplate.ts) key off this so displayed maxes never drift
 * from what's actually being scored.
 */
export const HEALTH_METRIC_WEIGHTS = {
	regularity: 20,
	recency: 20,
	description: 20,
	readme: 15,
	license: 15,
} as const;
