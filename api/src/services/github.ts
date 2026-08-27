/**
 * GitHub REST API service.
 *
 * All GitHub calls go through this module so rate-limit handling, auth headers,
 * and error normalisation live in one place. The module is intentionally
 * side-effect-free — it only reads from GitHub and returns typed data.
 *
 * Rate limiting:
 *   - Authenticated requests allow 5 000 req/hr vs 60 for anonymous.
 *   - We surface a 429 to the caller when GitHub returns 403 with a
 *     X-RateLimit-Remaining: 0 header so the frontend can show a friendly
 *     message instead of a generic error.
 */
import { createHttpError } from "../middleware/errorHandler";
import {
  GitHubUserStats,
  GitHubRepo,
  RepoInsights,
  RepoContributor,
} from "../types";

const GITHUB_API = "https://api.github.com";

const defaultHeaders: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (process.env.GITHUB_TOKEN) {
  defaultHeaders["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
}

/** Low-level fetch wrapper with error normalisation. */
async function ghFetch<T>(path: string): Promise<T> {
  const url = `${GITHUB_API}${path}`;
  const res = await fetch(url, { headers: defaultHeaders });

  if (!res.ok) {
    // Detect rate-limit exhaustion.
    if (
      res.status === 403 &&
      res.headers.get("X-RateLimit-Remaining") === "0"
    ) {
      const reset = res.headers.get("X-RateLimit-Reset");
      const resetDate = reset
        ? new Date(parseInt(reset, 10) * 1000).toISOString()
        : "unknown";
      throw createHttpError(
        429,
        `GitHub rate limit exceeded. Resets at ${resetDate}.`,
        "GITHUB_RATE_LIMIT"
      );
    }

    if (res.status === 404) {
      throw createHttpError(404, `GitHub resource not found: ${path}`, "GITHUB_NOT_FOUND");
    }

    const body = await res.text();
    throw createHttpError(
      502,
      `GitHub API error (${res.status}): ${body.slice(0, 200)}`,
      "GITHUB_API_ERROR"
    );
  }

  return res.json() as Promise<T>;
}

// --------------------------------------------------------------------------
// User stats
// --------------------------------------------------------------------------

export async function getUserStats(
  username: string,
  isPro: boolean
): Promise<GitHubUserStats> {
  // Fetch user profile and their repos in parallel.
  const [user, repos] = await Promise.all([
    ghFetch<GHUser>(`/users/${username}`),
    ghFetch<GHRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`),
  ]);

  // Free tier: only the top 3 repos; Pro: top 10.
  const repoLimit = isPro ? 10 : 3;
  const sortedRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, repoLimit);

  // Build language breakdown from repo primary languages.
  const languages = repos.reduce<Record<string, number>>((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] ?? 0) + 1;
    }
    return acc;
  }, {});

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    createdAt: user.created_at,
    topRepos: sortedRepos.map(normaliseRepo),
    languages,
  };
}

// --------------------------------------------------------------------------
// Repo insights
// --------------------------------------------------------------------------

export async function getRepoInsights(
  owner: string,
  repo: string
): Promise<RepoInsights> {
  // Fire all repo-level requests in parallel to keep latency low.
  const [repoData, languages, activity, contributors] = await Promise.all([
    ghFetch<GHRepo>(`/repos/${owner}/${repo}`),
    ghFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`),
    ghFetch<GHWeeklyActivity[]>(
      `/repos/${owner}/${repo}/stats/participation`
    ).catch(() => null), // stats endpoints occasionally return 202 (computing); handle gracefully
    ghFetch<GHContributor[]>(
      `/repos/${owner}/${repo}/contributors?per_page=10`
    ).catch(() => [] as GHContributor[]),
  ]);

  const weeklyCommits = activity ? activity.map((w) => w.total) : [];

  return {
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    defaultBranch: repoData.default_branch,
    languages,
    weeklyCommits,
    contributors: (contributors as GHContributor[]).map((c) => ({
      login: c.login,
      avatarUrl: c.avatar_url,
      contributions: c.contributions,
    })) as RepoContributor[],
  };
}

// --------------------------------------------------------------------------
// Internal GitHub API shapes (only the fields we use)
// --------------------------------------------------------------------------

interface GHUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GHRepo {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  html_url: string;
  updated_at: string;
  default_branch: string;
}

interface GHWeeklyActivity {
  total: number; // total commits that week
  owner: number;
  all: number[];
}

interface GHContributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

function normaliseRepo(r: GHRepo): GitHubRepo {
  return {
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    url: r.html_url,
    updatedAt: r.updated_at,
  };
}
