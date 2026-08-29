import { Response, NextFunction } from "express";
import { AuthedRequest } from "../types";
import { supabaseAdmin } from "../services/supabase";
import * as githubService from "../services/github";

/** Determine whether the caller has an active Pro subscription. */
async function getSubscriptionStatus(userId: string): Promise<boolean> {
	const { data } = await supabaseAdmin
		.from("profiles")
		.select("subscription_status")
		.eq("id", userId)
		.single();
	return data?.subscription_status === "active";
}

/**
 * GET /api/github/:username/stats
 *
 * Returns aggregated stats for a GitHub user. Free-tier callers get a
 * truncated view (fewer repos, no language breakdown detail).
 */
export async function getUserStats(
	req: AuthedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { username } = req.params;
		const isPro = await getSubscriptionStatus(req.user.sub);
		const stats = await githubService.getUserStats(username, isPro);
		res.json({ data: stats, tier: isPro ? "pro" : "free" });
	} catch (err) {
		next(err);
	}
}

/**
 * GET /api/repos/:owner/:repo/insights
 *
 * Returns detailed insights for a single repository.
 */
export async function getRepoInsights(
	req: AuthedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { owner, repo } = req.params;
		const isPro = await getSubscriptionStatus(req.user.sub);
		const insights = await githubService.getRepoInsights(owner, repo);
		res.json({ data: insights, tier: isPro ? "pro" });
	} catch (err) {
		next(err);
	}
}

/**
 * GET /api/github/:username/report
 *
 * Generates a downloadable PDF report for a GitHub user. Pro-only; the
 * `requirePro` middleware rejects free-tier callers before this runs.
 */
export async function getUserReport(
	req: AuthedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { username } = req.params;
		const pdf = await githubService.getUserReport(username);

		// Strip anything that isn't safe in a filename/header value.
		const safeUsername = String(username).replace(/[^a-zA-Z0-9-_.]/g, "_");

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${safeUsername}-github-report.pdf"`
		);
		res.send(pdf);
	} catch (err) {
		next(err);
	};
};