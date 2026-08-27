import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as githubController from "../controllers/github";
import { AuthedRequest } from "../types";
import { RequestHandler } from "express";

const router = Router();

// All GitHub routes require authentication.
router.use(requireAuth as RequestHandler);

// GET /api/github/:username/stats
router.get(
  "/:username/stats",
  githubController.getUserStats as RequestHandler
);

// GET /api/repos/:owner/:repo/insights  (note: mounted at /api/github in app.ts)
// Re-export the repo route here for cleaner grouping.
router.get(
  "/repos/:owner/:repo/insights",
  githubController.getRepoInsights as RequestHandler
);

export default router;
