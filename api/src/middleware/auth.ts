/**
 * Supabase JWT verification middleware.
 *
 * Supabase issues ES256 JWTs signed with the project's private key. We verify
 * the token's cryptographic signature using Supabase's public keys retrieved via JWKS.
 * Validated user metadata is attached to `req.user`.
 *
 * Why verify locally instead of using the Supabase client?
 * Verifying the signature ourselves using cached public keys avoids an async 
 * network API round-trip to Supabase on every incoming request.
 */
import { Request, Response, NextFunction } from "express";
import { SupabaseJwtPayload } from "../types";
import { createHttpError } from "../middleware/errorHandler";
import { createRemoteJWKSet, jwtVerify, errors } from "jose";

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
	throw new Error("SUPABASE_URL is not set. Add it to your .env file.");
}

// The JWKS endpoint exposes the project's public signing key(s).
// jose fetches and caches these keys automatically.
const JWKS = createRemoteJWKSet(
	new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);


export async function requireAuth(
	req: Request,
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
		if (err instanceof errors.JWTExpired) {
			next(createHttpError(401, "Token has expired"));
		} else if (err instanceof errors.JOSEError) {
			next(createHttpError(401, "Invalid token"));
		} else {
			next(err);
		}
	}
}
