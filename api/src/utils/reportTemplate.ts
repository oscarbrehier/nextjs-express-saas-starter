/**
 * Renders the Pro "GitHub Insights Report" as a self-contained HTML string
 * for `generatePdfFromHtml`. Mirrors the web app's Lab Report design system
 * (see /DESIGN.md at the repo root) — paper-and-ink palette, Public Sans +
 * Courier Prime, hairline brackets, a plain bordered score readout — so the
 * export reads as the same instrument, not a different product.
 */
import { GitHubUserStats, GitHubRepo, RepoInsights } from "../types";
import { HEALTH_METRIC_WEIGHTS } from "../constants/health";

export interface ReportRepoSection {
	repo: GitHubRepo;
	insights: RepoInsights | null;
}

const HEALTH_METRICS: { key: "regularity" | "recency" | "description" | "readme" | "license"; label: string; max: number }[] = [
	{ key: "regularity", label: "Commit regularity", max: HEALTH_METRIC_WEIGHTS.regularity },
	{ key: "recency", label: "Recently active", max: HEALTH_METRIC_WEIGHTS.recency },
	{ key: "description", label: "Has description", max: HEALTH_METRIC_WEIGHTS.description },
	{ key: "readme", label: "Has README", max: HEALTH_METRIC_WEIGHTS.readme },
	{ key: "license", label: "Has license", max: HEALTH_METRIC_WEIGHTS.license },
];

const STAGES = [
	{ min: 85, label: "Mature" },
	{ min: 65, label: "Established" },
	{ min: 40, label: "Developing" },
	{ min: 0, label: "Early stage" },
];

function stageFor(score: number): string {
	const rounded = Math.round(Math.max(0, Math.min(100, score)));
	return (STAGES.find((s) => rounded >= s.min) ?? STAGES[STAGES.length - 1]).label;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function healthBadge(total: number): string {
	const rounded = Math.round(Math.max(0, Math.min(100, total)));
	return `
		<div class="health-badge">
			<span class="health-score">${rounded}</span>
			<span class="health-stage">${escapeHtml(stageFor(total))}</span>
		</div>
	`;
}

function metricRow(label: string, value: number, max: number): string {
	const pct = Math.max(0, Math.min(100, (value / max) * 100));
	return `
		<div class="metric-row">
			<span class="metric-label">${escapeHtml(label)}</span>
			<div class="metric-track">
				<span class="metric-fill" style="width:${pct}%"></span>
				<span class="metric-tick" style="left:${pct}%"></span>
			</div>
			<span class="metric-value">${Math.round(value)}/${max}</span>
		</div>
	`;
}

function renderRepoSection({ repo, insights }: ReportRepoSection): string {
	const health = insights?.healthScore;
	return `
		<section class="report-card repo-card">
			<header class="card-header">
				<h3>${escapeHtml(repo.name)}</h3>
				${repo.language ? `<span class="card-meta">${escapeHtml(repo.language)}</span>` : ""}
			</header>
			<div class="card-body">
				${repo.description ? `<p class="repo-desc">${escapeHtml(repo.description)}</p>` : ""}
				<div class="repo-stats">
					<span><span class="repo-stats-label">STARS</span> ${repo.stars}</span>
					<span><span class="repo-stats-label">FORKS</span> ${repo.forks}</span>
					${insights ? `<span><span class="repo-stats-label">ISSUES</span> ${insights.openIssues}</span>` : ""}
				</div>
				${health ? `
					<div class="metrics-panel">
						${healthBadge(health.total)}
						<div class="metrics">
							${HEALTH_METRICS.map((m) => metricRow(m.label, health.breakdown[m.key], m.max)).join("")}
						</div>
					</div>
				` : `<p class="unavailable">Repository insights unavailable for this repo.</p>`}
				${insights && insights.contributors.length > 0 ? `
					<div class="contributors">
						<h4>Top contributors</h4>
						<ul>
							${insights.contributors.slice(0, 5).map((c) => `
								<li><img src="${escapeHtml(c.avatarUrl)}" width="18" height="18" /> ${escapeHtml(c.login)} &mdash; ${c.contributions} commits</li>
							`).join("")}
						</ul>
					</div>
				` : ""}
			</div>
		</section>
	`;
}

export function renderUserReportHtml(
	stats: GitHubUserStats,
	repoSections: ReportRepoSection[]
): string {
	const languageEntries = Object.entries(stats.languages).sort((a, b) => b[1] - a[1]);
	const languageTotal = languageEntries.reduce((sum, [, n]) => sum + n, 0);
	const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
	const joinedAt = new Date(stats.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" });

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />
<style>
	* { box-sizing: border-box; }
	body {
		font-family: "Public Sans", ui-sans-serif, system-ui, sans-serif;
		color: #14181b;
		background: #f5f6f2;
		margin: 0;
		padding: 8px;
	}
	.font-mono { font-family: "Courier Prime", ui-monospace, monospace; font-variant-numeric: tabular-nums; }

	header.masthead { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #d9dcd6; padding-bottom: 12px; margin-bottom: 24px; }
	header.masthead h1 { font-size: 18px; font-weight: 600; margin: 0; color: #14181b; }
	header.masthead .tagline { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #5b6469; margin-top: 2px; }
	header.masthead .meta { font-size: 11px; color: #5b6469; }

	.report-card { background: #ffffff; border: 1px solid #d9dcd6; border-radius: 3px; margin-bottom: 16px; page-break-inside: avoid; }
	.card-header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; border-bottom: 1px solid #d9dcd6; padding: 12px 18px; }
	.card-header h2, .card-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #14181b; }
	.card-meta { font-size: 11px; color: #5b6469; }
	.card-body { padding: 16px 18px; }

	.user-card-body { display: flex; gap: 16px; align-items: flex-start; }
	.user-card-body img { border: 1px solid #d9dcd6; }
	.user-bio { font-size: 12px; color: #5b6469; margin: 0 0 10px; }
	.user-stats { display: flex; gap: 20px; }
	.user-stat dt { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #5b6469; margin: 0 0 2px; }
	.user-stat dd { font-size: 13px; font-weight: 600; color: #14181b; margin: 0; }

	.section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #5b6469; margin: 0 0 12px; }
	.lang-row { display: flex; align-items: center; gap: 10px; font-size: 12px; margin-bottom: 8px; }
	.lang-name { width: 100px; flex-shrink: 0; color: #5b6469; }
	.lang-track { flex: 1; height: 6px; border: 1px solid #d9dcd6; }
	.lang-fill { display: block; height: 100%; background: rgba(91,100,105,0.4); }
	.lang-pct { width: 32px; text-align: right; color: #5b6469; }

	.repo-desc { font-size: 12px; color: #5b6469; margin: 0 0 8px; }
	.repo-stats { display: flex; gap: 16px; font-size: 11px; color: #5b6469; margin-bottom: 14px; }
	.repo-stats-label { letter-spacing: 0.08em; color: rgba(91,100,105,0.7); }

	.metrics-panel { display: flex; gap: 20px; border-top: 1px solid #d9dcd6; padding-top: 14px; }
	.health-badge { flex-shrink: 0; width: 68px; height: 68px; border: 1px solid #d9dcd6; display: flex; flex-direction: column; align-items: center; justify-content: center; }
	.health-score { font-size: 20px; font-weight: 700; line-height: 1; color: #14181b; }
	.health-stage { font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #5b6469; margin-top: 3px; }
	.metrics { flex: 1; }
	.metric-row { display: flex; align-items: center; gap: 10px; font-size: 11px; margin-bottom: 7px; }
	.metric-label { width: 110px; flex-shrink: 0; color: #5b6469; }
	.metric-track { position: relative; flex: 1; height: 4px; border-left: 1px solid #d9dcd6; border-right: 1px solid #d9dcd6; }
	.metric-track::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #d9dcd6; }
	.metric-fill { position: absolute; top: 50%; left: 0; height: 3px; margin-top: -1.5px; background: rgba(20,24,27,0.35); }
	.metric-tick { position: absolute; top: 0; bottom: 0; width: 1px; background: #14181b; }
	.metric-value { width: 32px; text-align: right; color: #14181b; }

	.unavailable { margin-top: 10px; font-size: 11px; color: #5b6469; font-style: italic; }
	.contributors { margin-top: 14px; border-top: 1px solid #d9dcd6; padding-top: 12px; }
	.contributors h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #5b6469; margin: 0 0 8px; }
	.contributors ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 12px; }
	.contributors li { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #5b6469; }
	.contributors img { border: 1px solid #d9dcd6; }

	footer.report-footer { margin-top: 20px; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #5b6469; text-align: center; }
</style>
</head>
<body>
	<header class="masthead">
		<div>
			<h1>GitHub Insights</h1>
			<div class="tagline">Diagnostic Report</div>
		</div>
		<span class="meta font-mono">Generated ${generatedAt}</span>
	</header>

	<section class="report-card">
		<header class="card-header">
			<h2>${escapeHtml(stats.name ?? stats.login)}</h2>
			<span class="card-meta font-mono">@${escapeHtml(stats.login)}</span>
		</header>
		<div class="card-body user-card-body">
			<img src="${escapeHtml(stats.avatarUrl)}" width="64" height="64" />
			<div>
				${stats.bio ? `<p class="user-bio">${escapeHtml(stats.bio)}</p>` : ""}
				<dl class="user-stats">
					<div class="user-stat"><dt>Repos</dt><dd class="font-mono">${stats.publicRepos}</dd></div>
					<div class="user-stat"><dt>Followers</dt><dd class="font-mono">${stats.followers}</dd></div>
					<div class="user-stat"><dt>Following</dt><dd class="font-mono">${stats.following}</dd></div>
					<div class="user-stat"><dt>Joined</dt><dd class="font-mono">${joinedAt}</dd></div>
				</dl>
			</div>
		</div>
	</section>

	${languageEntries.length > 0 ? `
		<section class="report-card">
			<header class="card-header"><h2>Languages</h2></header>
			<div class="card-body">
				${languageEntries.map(([lang, count]) => `
					<div class="lang-row">
						<span class="lang-name">${escapeHtml(lang)}</span>
						<div class="lang-track"><span class="lang-fill" style="width:${(count / languageTotal) * 100}%"></span></div>
						<span class="lang-pct font-mono">${Math.round((count / languageTotal) * 100)}%</span>
					</div>
				`).join("")}
			</div>
		</section>
	` : ""}

	<h3 class="section-title">Top Repositories</h3>
	${repoSections.map(renderRepoSection).join("")}

	<footer class="report-footer">GitHub Insights &mdash; Pro report for @${escapeHtml(stats.login)}</footer>
</body>
</html>`;
}
