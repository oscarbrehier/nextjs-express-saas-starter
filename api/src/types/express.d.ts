import { SupabaseJwtPayload } from "./index";

/**
 * Augments Express's Request with the verified Supabase user. Set by
 * `requireAuth`, which every route in this app runs before any controller
 * that reads `req.user` — so controllers can rely on it being present
 * without a separate request type or per-route casts.
 */
declare global {
	namespace Express {
		interface Request {
			user: SupabaseJwtPayload;
		}
	}
}
