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
	GHRepoHealth,
} from "../types";
import { generatePdfFromHtml } from "../utils/generatePdf";
import { renderUserReportHtml, ReportRepoSection } from "../utils/reportTemplate";

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

export const HEALTH_METRIC_WEIGHTS = {
	regularity: 20,
	recency: 20,
	description: 20,
	readme: 15,
	license: 15
} as const;

function computeRepoHealthScore(repoData: GHRepo, weeklyCommits: number[], hasReadme: boolean): GHRepoHealth {

	const descriptionScore = repoData.description ? HEALTH_METRIC_WEIGHTS.description : 0;
	const readmeScore = hasReadme ? HEALTH_METRIC_WEIGHTS.readme : 0;
	const licenseScore = repoData.license ? HEALTH_METRIC_WEIGHTS.license : 0;

	// Recency score
	const daysSincePush = (Date.now() - new Date(repoData.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
	const recencyRatio = 1 - (daysSincePush - 7) / (365 - 7);
	const recencyScore = Math.max(0, Math.min(HEALTH_METRIC_WEIGHTS.recency, HEALTH_METRIC_WEIGHTS.recency * recencyRatio));

	// Regularity score (guarded against empty array)
	const activeWeeks = weeklyCommits.filter((w) => w > 0).length;
	const activeRatio = weeklyCommits.length > 0 ? activeWeeks / weeklyCommits.length : 0;
	const regularityScore = Math.max(0, Math.min(HEALTH_METRIC_WEIGHTS.regularity, HEALTH_METRIC_WEIGHTS.regularity * activeRatio));

	const breakdown = {
		recency: recencyScore,
		regularity: regularityScore,
		description: descriptionScore,
		readme: readmeScore,
		license: licenseScore,
	};

	const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

	return { total, breakdown };

};

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
// User Report
// --------------------------------------------------------------------------

export async function getUserReport(username: string): Promise<Buffer> {
	// Full (Pro-tier) stats: top 10 repos with the language breakdown.
	const stats = await getUserStats(username, true);

	const repoSections: ReportRepoSection[] = await Promise.all(
		stats.topRepos.map(async (repo) => {
			const [owner, name] = repo.fullName.split("/");
			// A single repo's insights failing (e.g. stats still computing)
			// shouldn't block the whole report — fall back to the basics.
			const insights = await getRepoInsights(owner, name).catch(() => null);
			return { repo, insights };
		})
	);

	const html = renderUserReportHtml(stats, repoSections);
	return generatePdfFromHtml(html);
};

// --------------------------------------------------------------------------
// Repo insights
// --------------------------------------------------------------------------

export async function getRepoInsights(
	owner: string,
	repo: string
): Promise<RepoInsights> {
	// Fire all repo-level requests in parallel to keep latency low.
	const [repoData, languages, activity, contributors, hasReadme] = await Promise.all([
		ghFetch<GHRepo>(`/repos/${owner}/${repo}`),
		ghFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`),
		ghFetch<GHParticipation>(
			`/repos/${owner}/${repo}/stats/participation`
		).catch(() => null), // stats endpoints occasionally return 202 (computing); handle gracefully
		ghFetch<GHContributor[]>(
			`/repos/${owner}/${repo}/contributors?per_page=10`
		).catch(() => [] as GHContributor[]),
		ghFetch(`/repos/${owner}/${repo}/readme`).then(() => true).catch(() => false)
	]);

	// activity.all = commits by everyone per week (52 entries)
	const weeklyCommits = activity ? activity.all : [];

	const healthScore = computeRepoHealthScore(repoData, weeklyCommits, hasReadme);

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
		healthScore
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
	has_issues: boolean;
	pushed_at: string;
	updated_at: string;
	default_branch: string;
	license: {
		key: string;
	} | null;
}


// The participation endpoint returns one object, not an array.
// `all` = total commits per week by everyone; `owner` = by the repo owner only.
interface GHParticipation {
	all: number[];
	owner: number[];
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
