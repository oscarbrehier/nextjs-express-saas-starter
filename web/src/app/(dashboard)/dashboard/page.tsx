"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { fetchUserStats, fetchRepoInsights, fetchUserReportPdf } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { GitHubUserStats, ApiResponse, RepoInsights, GHRepoHealth } from "@/types";
import { ReportCard } from "@/components/ui/ReportCard";
import { MeasuredValue } from "@/components/ui/MeasuredValue";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { SealedPanel } from "@/components/ui/SealedPanel";

// ---------------------------------------------------------------------------
// Health score helpers
// ---------------------------------------------------------------------------

const HEALTH_METRICS: {
	key: keyof GHRepoHealth["breakdown"];
	label: string;
	max: number;
}[] = [
		{ key: "regularity", label: "Commit regularity", max: 30 },
		{ key: "recency", label: "Recently active", max: 20 },
		{ key: "description", label: "Has description", max: 20 },
		{ key: "readme", label: "Has README", max: 15 },
		{ key: "license", label: "Has license", max: 15 },
	];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
	const [username, setUsername] = useState("");
	const [result, setResult] = useState<ApiResponse<GitHubUserStats> | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Keyed by repo.fullName — populated only for Pro users after stats load.
	const [repoInsightsMap, setRepoInsightsMap] = useState<Record<string, RepoInsights>>({});
	const [insightsLoading, setInsightsLoading] = useState(false);

	const [reportLoading, setReportLoading] = useState(false);
	const [reportError, setReportError] = useState<string | null>(null);

	async function getToken(): Promise<string | null> {
		const supabase = createClient();
		const { data: { session } } = await supabase.auth.getSession();
		return session?.access_token ?? null;
	}

	async function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		if (!username.trim()) return;

		setError(null);
		setLoading(true);
		setResult(null);
		setRepoInsightsMap({});
		setInsightsLoading(false);

		try {
			const token = await getToken();
			if (!token) { setError("Session expired. Please log in again."); return; }

			const data = await fetchUserStats(username.trim(), token);
			setResult(data);

			// For Pro users: fetch all repo insights in parallel so health scores
			// render on the cards without a manual trigger.
			if (data.tier === "pro") {
				setInsightsLoading(true);
				try {
					const settled = await Promise.allSettled(
						data.data.topRepos.map(async (repo) => {
							const [owner, name] = repo.fullName.split("/");
							const res = await fetchRepoInsights(owner, name, token);
							return [repo.fullName, res.data] as [string, RepoInsights];
						})
					);
					const map: Record<string, RepoInsights> = {};
					settled.forEach((r) => {
						if (r.status === "fulfilled") {
							const [fullName, insights] = r.value;
							map[fullName] = insights;
						}
					});
					setRepoInsightsMap(map);
				} finally {
					setInsightsLoading(false);
				}
			}
		} catch (err) {
			setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	async function handleDownloadReport() {
		if (!result) return;

		setReportError(null);
		setReportLoading(true);

		try {
			const token = await getToken();
			if (!token) { setReportError("Session expired. Please log in again."); return; }

			const blob = await fetchUserReportPdf(result.data.login, token);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${result.data.login}-github-report.pdf`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			setReportError(err instanceof ApiError ? err.message : "Failed to generate report. Please try again.");
		} finally {
			setReportLoading(false);
		}
	}

	const isPro = result?.tier === "pro";

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="border-b border-rule pb-4">
				<h1 className="text-xl font-semibold text-ink">Dashboard</h1>
				<p className="mt-1 text-sm text-ink-muted">
					Enter a GitHub username to run a diagnostic.
				</p>
			</div>

			<form onSubmit={handleSearch} className="flex items-end gap-3">
				<label className="block flex-1">
					<span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
						GitHub username
					</span>
					<input
						type="text"
						placeholder="e.g. torvalds"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full border-0 border-b border-rule bg-transparent px-0 py-2 font-mono text-sm text-ink placeholder:text-ink-muted focus:border-accent"
					/>
				</label>
				<button
					type="submit"
					disabled={loading}
					className="shrink-0 bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-50"
				>
					{loading ? "Running…" : "Run"}
				</button>
			</form>

			{error && (
				<div className="border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
					{error}
				</div>
			)}

			{!result && !loading && !error && (
				<ReportCard title="No record yet" meta="Awaiting input">
					<div className="flex gap-6 opacity-40">
						<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-dashed border-ink-muted">
							<span className="font-mono text-xs text-ink-muted">—</span>
						</div>
						<div className="flex-1 space-y-2.5">
							{["Commit regularity", "Recently active", "Has description"].map((label) => (
								<div key={label} className="flex items-center gap-3">
									<span className="w-32 shrink-0 text-xs text-ink-muted sm:w-36 sm:text-sm">
										{label}
									</span>
									<div className="h-px flex-1 bg-rule" />
								</div>
							))}
						</div>
					</div>
					<p className="mt-4 text-sm text-ink-muted">
						Run a diagnostic above to populate this report.
					</p>
				</ReportCard>
			)}

			{result && (
				<div className="space-y-6">
					{!isPro && (
						<div className="border border-rule bg-surface px-4 py-3 text-sm text-ink-muted">
							You&apos;re on the <strong className="text-ink">Free</strong> record — showing top 3
							repos.{" "}
							<a href="/billing" className="font-medium text-accent hover:underline">
								Upgrade to Pro
							</a>{" "}
							to unlock full diagnostics and repo health verdicts.
						</div>
					)}

					<div className="flex items-center justify-between gap-3">
						<h2 className="font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
							Record — @{result.data.login}
						</h2>
						{isPro ? (
							<button
								onClick={handleDownloadReport}
								disabled={reportLoading}
								className="shrink-0 border border-rule px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink disabled:opacity-50"
							>
								{reportLoading ? "Generating…" : "Export — PDF"}
							</button>
						) : (
							<a
								href="/billing"
								className="shrink-0 border border-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-accent hover:bg-accent/5"
							>
								Export — PDF (Pro)
							</a>
						)}
					</div>

					{reportError && (
						<div className="border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
							{reportError}
						</div>
					)}

					<ProfileSummary stats={result.data} />

					{Object.keys(result.data.languages).length > 0 && (
						<LanguageBreakdown languages={result.data.languages} />
					)}

					<div>
						<h2 className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
							Top repositories
						</h2>
						<div className="space-y-3">
							{result.data.topRepos.map((repo) => (
								<RepoReport
									key={repo.fullName}
									repo={repo}
									insights={repoInsightsMap[repo.fullName] ?? null}
									isPro={isPro ?? false}
									insightsLoading={insightsLoading}
								/>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Profile summary — the intake header
// ---------------------------------------------------------------------------

function ProfileSummary({ stats }: { stats: GitHubUserStats }) {
	return (
		<ReportCard
			title={stats.name ?? stats.login}
			meta={
				<a
					href={`https://github.com/${stats.login}`}
					target="_blank"
					rel="noreferrer"
					className="hover:text-accent hover:underline"
				>
					@{stats.login}
				</a>
			}
		>
			<div className="flex gap-5">
				<a
					href={`https://github.com/${stats.login}`}
					target="_blank"
					rel="noreferrer"
					className="shrink-0"
				>
					<Image
						src={stats.avatarUrl}
						alt={stats.login}
						width={64}
						height={64}
						className="border border-rule transition-opacity hover:opacity-80"
					/>
				</a>
				<div className="min-w-0 flex-1">
					{stats.bio && <p className="text-sm text-ink-muted">{stats.bio}</p>}
					<dl className="mt-3 flex gap-6 text-sm">
						<div>
							<dt className="text-[10px] uppercase tracking-[0.1em] text-ink-muted">Repos</dt>
							<dd className="font-mono font-semibold tabular-nums text-ink">{stats.publicRepos}</dd>
						</div>
						<div>
							<dt className="text-[10px] uppercase tracking-[0.1em] text-ink-muted">Followers</dt>
							<dd className="font-mono font-semibold tabular-nums text-ink">{stats.followers}</dd>
						</div>
						<div>
							<dt className="text-[10px] uppercase tracking-[0.1em] text-ink-muted">Following</dt>
							<dd className="font-mono font-semibold tabular-nums text-ink">{stats.following}</dd>
						</div>
					</dl>
				</div>
			</div>
		</ReportCard>
	);
}

// ---------------------------------------------------------------------------
// Language breakdown
// ---------------------------------------------------------------------------

function LanguageBreakdown({ languages }: { languages: Record<string, number> }) {
	const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
	const total = sorted.reduce((sum, [, n]) => sum + n, 0);

	return (
		<ReportCard title="Languages">
			<div className="space-y-2.5">
				{sorted.slice(0, 8).map(([lang, count]) => {
					const pct = Math.round((count / total) * 100);
					return (
						<div key={lang} className="flex items-center gap-3 text-sm">
							<span className="w-24 shrink-0 truncate text-ink-muted">{lang}</span>
							<div className="h-2 flex-1 border border-rule">
								<div className="h-full bg-ink-muted/40" style={{ width: `${pct}%` }} />
							</div>
							<span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-ink-muted">
								{pct}%
							</span>
						</div>
					);
				})}
			</div>
		</ReportCard>
	);
}

// ---------------------------------------------------------------------------
// Repo report
// ---------------------------------------------------------------------------

function RepoReport({
	repo,
	insights,
	isPro,
	insightsLoading,
}: {
	repo: GitHubUserStats["topRepos"][number];
	insights: RepoInsights | null;
	isPro: boolean;
	insightsLoading: boolean;
}) {
	return (
		<ReportCard
			title={
				<a href={repo.url} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
					{repo.name}
				</a>
			}
			meta={repo.language ?? undefined}
		>
			<div className="space-y-4">
				<div>
					{repo.description && (
						<p className="text-sm text-ink-muted">{repo.description}</p>
					)}
					<div className="mt-2 flex gap-4 font-mono text-xs tabular-nums text-ink-muted">
						<span>
							<span className="tracking-[0.08em] text-ink-muted/70">STARS</span> {repo.stars}
						</span>
						<span>
							<span className="tracking-[0.08em] text-ink-muted/70">FORKS</span> {repo.forks}
						</span>
					</div>
				</div>

				<div className="border-t border-rule pt-4">
					{isPro ? (
						insightsLoading || !insights ? (
							<HealthSkeleton />
						) : (

							<div className="flex gap-6">
								<HealthBadge score={insights.healthScore.total} />
								<div className="flex-1 space-y-2.5">
									{HEALTH_METRICS.map(({ key, label, max }) => (
										<MeasuredValue
											key={key}
											label={label}
											value={insights.healthScore.breakdown[key]}
											max={max}
										/>
									))}
								</div>
							</div>

						)
					) : (
						<SealedPanel />
					)}
				</div>
			</div>
		</ReportCard>
	);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function HealthSkeleton() {
	return (
		<div className="flex animate-pulse gap-6">
			<div className="h-20 w-20 shrink-0 rounded-full border border-rule" />
			<div className="flex-1 space-y-2.5 pt-1">
				{[65, 50, 85, 90, 30].map((w, i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="h-2.5 w-32 shrink-0 bg-ink-muted/15" />
						<div className="h-2.5 flex-1 bg-ink-muted/10" />
					</div>
				))}
			</div>
		</div>
	);
}
