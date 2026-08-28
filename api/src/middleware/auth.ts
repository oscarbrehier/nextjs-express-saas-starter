/**
 * Supabase JWT verification middleware.
 *
 * Supabase issues HS256 JWTs signed with the project's JWT secret. We verify
 * the token using that secret and attach the decoded payload to `req.user`.
 *
 * Why not use the Supabase client here?  The admin client can decode tokens,
 * but verifying the signature cryptographically ourselves is more explicit and
 * avoids an async network round-trip per request.
 */
import { Response, NextFunction } from "express";
import { AuthedRequest, SupabaseJwtPayload } from "../types";
import { createHttpError } from "../middleware/errorHandler";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { JOSEError, JWTExpired } from "jose/errors";

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
	throw new Error("SUPABASE_URL is not set. Add it to your .env file.");
};

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
if (!SUPABASE_JWT_SECRET) {
	// Fail loud at startup, not silently at request time.
	throw new Error("SUPABASE_JWT_SECRET is not set. Add it to your .env file.");
};

// The JWKS endpoint exposes the project's public signing key(s).
// jose fetches and caches these keys automatically.
const JWKS = createRemoteJWKSet(
	new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);


export async function requireAuth(
	req: AuthedRequest,
	res: Response,
	next: NextFunction
): Promise<void> {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		next(createHttpError(401, "Missing or malformed Authorization header"));
		return;
	}

	const token = authHeader.slice(7); // strip "Bearer "

	try {
		const { payload } = await jwtVerify(token, JWKS, {
			algorithms: ["ES256"],
			audience: "authenticated", // Supabase sets aud = "authenticated" for logged-in users
		});

		if (typeof payload.sub !== "string") {
			next(createHttpError(401, "Token payload missing subject"));
			return;
		}

		req.user = payload as SupabaseJwtPayload;
		next();

	} catch (err) {
		if (err instanceof JWTExpired) {
			next(createHttpError(401, "Token has expired"));
		} else if (err instanceof JOSEError) {
			next(createHttpError(401, "Invalid token"));
		} else {
			next(err);
		}
	}
}
