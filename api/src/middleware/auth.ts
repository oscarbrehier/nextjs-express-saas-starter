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
import jwt from "jsonwebtoken";
import { AuthedRequest, SupabaseJwtPayload } from "../types";
import { createHttpError } from "../middleware/errorHandler";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_JWT_SECRET) {
  // Fail loud at startup, not silently at request time.
  throw new Error("SUPABASE_JWT_SECRET is not set. Add it to your .env file.");
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(createHttpError(401, "Missing or malformed Authorization header"));
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, SUPABASE_JWT_SECRET, {
      algorithms: ["HS256"],
      audience: "authenticated", // Supabase sets aud = "authenticated" for logged-in users
    }) as SupabaseJwtPayload;

    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(createHttpError(401, "Token has expired"));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(createHttpError(401, "Invalid token"));
    } else {
      next(err);
    }
  }
}
