/**
 * Renders the Pro "GitHub Insights Report" as a self-contained HTML string
 * for `generatePdfFromHtml`. Mirrors the styling used on the dashboard
 * (indigo health rings/bars) so the PDF feels like an extension of the app.
 */
import { GitHubUserStats, GitHubRepo, RepoInsights } from "../types";

export interface ReportRepoSection {
	repo: GitHubRepo;
	insights: RepoInsights | null;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function healthRingSvg(total: number): string {
	const clamped = Math.max(0, Math.min(100, Math.round(total)));
	const offset = CIRCUMFERENCE * (1 - clamped / 100);
	return `
		<svg viewBox="0 0 100 100" width="90" height="90" style="transform: rotate(-90deg);">
			<circle cx="50" cy="50" r="${RADIUS}" fill="none" stroke="#e0e7ff" stroke-width="10" />
			<circle cx="50" cy="50" r="${RADIUS}" fill="none" stroke="#6366f1" stroke-width="10"
				stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}" />
		</svg>
	`;
}

function metricBar(label: string, value: number, max: number): string {
	const pct = Math.max(0, Math.min(100, (value / max) * 100));
	return `
		<div class="metric-row">
			<span class="metric-label">${escapeHtml(label)}</span>
			<div class="metric-track"><div class="metric-fill" style="width:${pct}%"></div></div>
			<span class="metric-value">${Math.round(value)}/${max}</span>
		</div>
	`;
}

function renderRepoSection({ repo, insights }: ReportRepoSection): string {
	const health = insights?.healthScore;
	return `
		<section class="repo-card">
			<div class="repo-header">
				<div>
					<h3>${escapeHtml(repo.name)}</h3>
					${repo.description ? `<p class="repo-desc">${escapeHtml(repo.description)}</p>` : ""}
					<div class="repo-meta">
						${repo.language ? `<span>${escapeHtml(repo.language)}</span>` : ""}
						<span>&#9733; ${repo.stars}</span>
						<span>&#x2442; ${repo.forks}</span>
						${insights ? `<span>${insights.openIssues} open issues</span>` : ""}
					</div>
				</div>
				${health ? `
					<div class="health-ring">
						${healthRingSvg(health.total)}
						<div class="health-score">${Math.round(health.total)}<span>/100</span></div>
					</div>
				` : ""}
			</div>
			${health ? `
				<div class="metrics">
					${metricBar("Commit regularity", health.breakdown.regularity, 30)}
					${metricBar("Recently active", health.breakdown.recency, 20)}
					${metricBar("Has description", health.breakdown.description, 20)}
					${metricBar("Has README", health.breakdown.readme, 15)}
					${metricBar("Has license", health.breakdown.license, 15)}
				</div>
			` : `<p class="unavailable">Repository insights unavailable for this repo.</p>`}
			${insights && insights.contributors.length > 0 ? `
				<div class="contributors">
					<h4>Top contributors</h4>
					<ul>
						${insights.contributors.slice(0, 5).map((c) => `
							<li><img src="${escapeHtml(c.avatarUrl)}" width="20" height="20" /> ${escapeHtml(c.login)} &mdash; ${c.contributions} commits</li>
						`).join("")}
					</ul>
				</div>
			` : ""}
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
<style>
	* { box-sizing: border-box; }
	body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; }
	header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 24px; }
	header h1 { font-size: 20px; margin: 0; color: #111827; }
	header .meta { font-size: 11px; color: #9ca3af; }
	.user-card { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 28px; }
	.user-card img { border-radius: 50%; }
	.user-card h2 { margin: 0; font-size: 18px; }
	.user-card .handle { color: #6b7280; font-size: 13px; margin: 2px 0 8px; }
	.user-card .bio { font-size: 13px; color: #4b5563; margin: 0 0 8px; }
	.user-stats span { margin-right: 16px; font-size: 12px; color: #6b7280; }
	.user-stats strong { color: #111827; }
	.block { margin-bottom: 28px; }
	.section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin: 0 0 12px; }
	.lang-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; }
	.lang-name { width: 110px; flex-shrink: 0; color: #374151; }
	.lang-track { flex: 1; height: 6px; background: #eef2ff; border-radius: 4px; overflow: hidden; }
	.lang-fill { height: 6px; background: #6366f1; }
	.repo-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
	.repo-header { display: flex; justify-content: space-between; gap: 16px; }
	.repo-header h3 { margin: 0 0 4px; font-size: 14px; color: #4338ca; }
	.repo-desc { font-size: 12px; color: #6b7280; margin: 0 0 6px; }
	.repo-meta span { font-size: 11px; color: #9ca3af; margin-right: 10px; }
	.health-ring { position: relative; width: 90px; height: 90px; flex-shrink: 0; text-align: center; }
	.health-score { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #111827; }
	.health-score span { display: block; font-size: 9px; font-weight: 400; color: #9ca3af; }
	.metrics { margin-top: 14px; }
	.metric-row { display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 5px; }
	.metric-label { width: 120px; flex-shrink: 0; color: #6b7280; }
	.metric-track { flex: 1; height: 5px; background: #eef2ff; border-radius: 4px; overflow: hidden; }
	.metric-fill { height: 5px; background: #6366f1; }
	.metric-value { width: 34px; text-align: right; color: #9ca3af; }
	.unavailable { margin-top: 10px; font-size: 11px; color: #9ca3af; font-style: italic; }
	.contributors { margin-top: 12px; }
	.contributors h4 { font-size: 11px; text-transform: uppercase; color: #9ca3af; margin: 0 0 6px; }
	.contributors ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
	.contributors li { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #4b5563; }
	.contributors img { border-radius: 50%; }
	footer { margin-top: 24px; font-size: 10px; color: #d1d5db; text-align: center; }
</style>
</head>
<body>
	<header>
		<h1>GitHub Insights Report</h1>
		<span class="meta">Generated ${generatedAt}</span>
	</header>

	<div class="user-card">
		<img src="${escapeHtml(stats.avatarUrl)}" width="72" height="72" />
		<div>
			<h2>${escapeHtml(stats.name ?? stats.login)}</h2>
			<p class="handle">@${escapeHtml(stats.login)}</p>
			${stats.bio ? `<p class="bio">${escapeHtml(stats.bio)}</p>` : ""}
			<div class="user-stats">
				<span><strong>${stats.publicRepos}</strong> repos</span>
				<span><strong>${stats.followers}</strong> followers</span>
				<span><strong>${stats.following}</strong> following</span>
				<span>Joined ${joinedAt}</span>
			</div>
		</div>
	</div>

	${languageEntries.length > 0 ? `
		<div class="block">
			<h3 class="section-title">Languages</h3>
			${languageEntries.map(([lang, count]) => `
				<div class="lang-row">
					<span class="lang-name">${escapeHtml(lang)}</span>
					<div class="lang-track"><div class="lang-fill" style="width:${(count / languageTotal) * 100}%"></div></div>
					<span>${Math.round((count / languageTotal) * 100)}%</span>
				</div>
			`).join("")}
		</div>
	` : ""}

	<div class="block">
		<h3 class="section-title">Top Repositories</h3>
		${repoSections.map(renderRepoSection).join("")}
	</div>

	<footer>GitHub Insights &mdash; Pro report for @${escapeHtml(stats.login)}</footer>
</body>
</html>`;
}
