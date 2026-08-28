/**
 * Typed wrapper around fetch calls to the Express API.
 *
 * Always attaches the Supabase access token from the provided session.
 * Throws on non-2xx responses with the API's error message.
 */
import { ApiResponse, GitHubUserStats, RepoInsights } from "@/types";

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly code?: string | null
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiFetch<T>(
	path: string,
	accessToken: string,
	options?: RequestInit
): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
			...(options?.headers ?? {}),
		},
	});

	const body = await res.json();

	if (!res.ok) {
		throw new ApiError(
			res.status,
			body?.error?.message ?? "Unknown API error",
			body?.error?.code
		);
	}

	return body as T;
}

export async function fetchUserStats(
	username: string,
	accessToken: string
): Promise<ApiResponse<GitHubUserStats>> {
	return apiFetch<ApiResponse<GitHubUserStats>>(
		`/api/github/${encodeURIComponent(username)}/stats`,
		accessToken
	);
}

export async function fetchRepoInsights(
	owner: string,
	repo: string,
	accessToken: string
): Promise<ApiResponse<RepoInsights>> {
	return apiFetch<ApiResponse<RepoInsights>>(
		`/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/insights`,
		accessToken
	);
}

/**
 * Downloads the Pro PDF report for a user. Unlike `apiFetch`, the success
 * response body is a binary PDF rather than JSON, so this reads it as a
 * Blob; only the error path is JSON.
 */
export async function fetchUserReportPdf(
	username: string,
	accessToken: string
): Promise<Blob> {
	const res = await fetch(
		`${API_BASE}/api/github/${encodeURIComponent(username)}/report`,
		{ headers: { Authorization: `Bearer ${accessToken}` } }
	);

	if (!res.ok) {
		let message = "Unknown API error";
		let code: string | null | undefined;
		try {
			const body = await res.json();
			message = body?.error?.message ?? message;
			code = body?.error?.code;
		} catch {
			// Error response wasn't JSON — fall back to the generic message.
		}
		throw new ApiError(res.status, message, code);
	}

	return res.blob();
}

export async function createCheckoutSession(
	accessToken: string
): Promise<{ url: string }> {
	return apiFetch<{ url: string }>("/api/stripe/checkout", accessToken, {
		method: "POST",
	});
}

export async function createPortalSession(
	accessToken: string
): Promise<{ url: string }> {
	return apiFetch<{ url: string }>("/api/stripe/portal", accessToken, {
		method: "POST",
	});
}

export { ApiError };
