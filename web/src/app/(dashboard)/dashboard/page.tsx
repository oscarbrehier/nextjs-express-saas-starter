"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { fetchUserStats, fetchRepoInsights, fetchUserReportPdf } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { GitHubUserStats, ApiResponse, RepoInsights, GHRepoHealth } from "@/types";

// ---------------------------------------------------------------------------
// Health score helpers
// ---------------------------------------------------------------------------

const HEALTH_METRICS: {
  key: keyof GHRepoHealth["breakdown"];
  label: string;
  max: number;
}[] = [
  { key: "regularity",  label: "Commit regularity", max: 30 },
  { key: "recency",     label: "Recently active",   max: 20 },
  { key: "description", label: "Has description",   max: 20 },
  { key: "readme",      label: "Has README",        max: 15 },
  { key: "license",     label: "Has license",       max: 15 },
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter a GitHub username to explore their activity.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="e.g. torvalds"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {!isPro && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              You&apos;re on the <strong>Free</strong> plan — showing top 3 repos.{" "}
              <a href="/billing" className="underline font-medium">Upgrade to Pro</a>{" "}
              to unlock full stats and repo health scores.
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Results for @{result.data.login}</h2>
            {isPro ? (
              <button
                onClick={handleDownloadReport}
                disabled={reportLoading}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {reportLoading ? "Generating…" : "Download PDF Report"}
              </button>
            ) : (
              <a
                href="/billing"
                className="rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
              >
                Unlock PDF Report — Pro
              </a>
            )}
          </div>

          {reportError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {reportError}
            </div>
          )}

          <UserCard stats={result.data} />

          {Object.keys(result.data.languages).length > 0 && (
            <LanguageBreakdown languages={result.data.languages} />
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Top Repositories
            </h2>
            <div className="space-y-3">
              {result.data.topRepos.map((repo) => (
                <RepoCard
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
// User card
// ---------------------------------------------------------------------------

function UserCard({ stats }: { stats: GitHubUserStats }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 flex gap-5 items-start">
      <Image
        src={stats.avatarUrl}
        alt={stats.login}
        width={72}
        height={72}
        className="rounded-full shrink-0"
      />
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">{stats.name ?? stats.login}</p>
        <p className="text-sm text-gray-500">@{stats.login}</p>
        {stats.bio && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{stats.bio}</p>
        )}
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          <span><strong className="text-gray-900">{stats.publicRepos}</strong> repos</span>
          <span><strong className="text-gray-900">{stats.followers}</strong> followers</span>
          <span><strong className="text-gray-900">{stats.following}</strong> following</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Language breakdown
// ---------------------------------------------------------------------------

function LanguageBreakdown({ languages }: { languages: Record<string, number> }) {
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
  const total = sorted.reduce((sum, [, n]) => sum + n, 0);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Languages</h2>
      <div className="space-y-2">
        {sorted.slice(0, 8).map(([lang, count]) => (
          <div key={lang} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-gray-600 truncate">{lang}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full"
                style={{ width: `${Math.round((count / total) * 100)}%` }}
              />
            </div>
            <span className="text-gray-400 w-8 text-right">
              {Math.round((count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Repo card
// ---------------------------------------------------------------------------

function RepoCard({
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Basic repo info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-indigo-700 hover:underline"
          >
            {repo.name}
          </a>
          {repo.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{repo.description}</p>
          )}
          <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
            {repo.language && <span>{repo.language}</span>}
            <span>&#9733; {repo.stars}</span>
            <span>&#x2442; {repo.forks}</span>
          </div>
        </div>
      </div>

      {/* Health score — Pro feature */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {isPro ? (
          insightsLoading || !insights
            ? <HealthSkeleton />
            : <InlineHealthScore health={insights.healthScore} />
        ) : (
          <LockedHealthScore />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline health score (Pro users)
// ---------------------------------------------------------------------------

const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function InlineHealthScore({ health }: { health: GHRepoHealth }) {
  const total = Math.round(health.total);
  const offset = RING_CIRCUMFERENCE * (1 - total / 100);

  return (
    <div className="flex gap-6 items-center">
      {/* Score ring */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
            <circle cx="38" cy="38" r={RING_RADIUS} fill="none" stroke="#e0e7ff" strokeWidth="10" />
            <circle
              cx="38" cy="38" r={RING_RADIUS}
              fill="none"
              stroke="#6366f1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-gray-900 leading-none">{total}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">/100</span>
          </div>
        </div>
        <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
          Health
        </span>
      </div>

      {/* Metric bars */}
      <div className="flex-1 space-y-2.5">
        {HEALTH_METRICS.map(({ key, label, max }) => {
          const value = health.breakdown[key];
          const pct = (value / max) * 100;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-gray-500">{label}</span>
              <div className="flex-1 h-2 bg-indigo-50 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs text-gray-400 tabular-nums">
                {Math.round(value)}/{max}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Locked health score (free users)
// ---------------------------------------------------------------------------

function LockedHealthScore() {
  return (
    <div className="relative select-none">
      {/* Blurred placeholder that hints at the shape of the real content */}
      <div className="blur-sm pointer-events-none opacity-50 flex gap-5 items-start">
        <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          {[80, 55, 100, 100, 0].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-1.5 rounded-full bg-gray-300" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA centred over the blur */}
      <div className="absolute inset-0 flex items-center justify-center">
        <a
          href="/billing"
          className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Unlock health score — Pro
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function HealthSkeleton() {
  return (
    <div className="flex gap-5 items-start animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        {[65, 50, 85, 90, 30].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-100 rounded shrink-0" />
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
