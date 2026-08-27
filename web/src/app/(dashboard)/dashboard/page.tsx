"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchUserStats } from "@/lib/api";
import { GitHubUserStats, ApiResponse } from "@/types";
import { ApiError } from "@/lib/api";
import Image from "next/image";

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<ApiResponse<GitHubUserStats> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Session expired. Please log in again.");
        return;
      }

      const data = await fetchUserStats(username.trim(), session.access_token);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter a GitHub username to explore their activity.
        </p>
      </div>

      {/* Search form */}
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

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.tier === "free" && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              You&apos;re on the <strong>Free</strong> plan — showing top 3
              repos.{" "}
              <a href="/billing" className="underline font-medium">
                Upgrade to Pro
              </a>{" "}
              to unlock full stats.
            </div>
          )}

          {/* User card */}
          <UserCard stats={result.data} />

          {/* Languages */}
          {Object.keys(result.data.languages).length > 0 && (
            <LanguageBreakdown languages={result.data.languages} />
          )}

          {/* Repos */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Top Repositories
            </h2>
            <div className="space-y-3">
              {result.data.topRepos.map((repo) => (
                <RepoCard key={repo.fullName} repo={repo} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        <p className="font-semibold text-gray-900">
          {stats.name ?? stats.login}
        </p>
        <p className="text-sm text-gray-500">@{stats.login}</p>
        {stats.bio && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{stats.bio}</p>
        )}
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          <span>
            <strong className="text-gray-900">{stats.publicRepos}</strong> repos
          </span>
          <span>
            <strong className="text-gray-900">{stats.followers}</strong>{" "}
            followers
          </span>
          <span>
            <strong className="text-gray-900">{stats.following}</strong>{" "}
            following
          </span>
        </div>
      </div>
    </div>
  );
}

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

function RepoCard({
  repo,
}: {
  repo: GitHubUserStats["topRepos"][number];
}) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-indigo-700">{repo.name}</p>
        <div className="flex gap-3 text-xs text-gray-400 shrink-0">
          <span>&#9733; {repo.stars}</span>
          <span>&#x2442; {repo.forks}</span>
        </div>
      </div>
      {repo.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
          {repo.description}
        </p>
      )}
      {repo.language && (
        <p className="text-xs text-gray-400 mt-2">{repo.language}</p>
      )}
    </a>
  );
}
