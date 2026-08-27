/**
 * Tier-gating middleware.
 *
 * Looks up the caller's profile in Supabase and rejects the request when the
 * user is on the free tier. Attach this after `requireAuth` on routes that are
 * Pro-only.
 */
import { Response, NextFunction } from "express";
import { supabaseAdmin } from "../services/supabase";
import { AuthedRequest } from "../types";
import { createHttpError } from "./errorHandler";

export async function requirePro(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("subscription_status")
      .eq("id", req.user.sub)
      .single();

    if (error || !profile) {
      next(createHttpError(403, "Could not verify subscription status"));
      return;
    }

    if (profile.subscription_status !== "active") {
      next(
        createHttpError(
          403,
          "This feature requires a Pro subscription",
          "PRO_REQUIRED"
        )
      );
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
