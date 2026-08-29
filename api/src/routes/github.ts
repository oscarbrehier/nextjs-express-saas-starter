import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requirePro } from "../middleware/requirePro";
import { requireParams } from "../middleware/requireParams";
import * as githubController from "../controllers/github";

const router = Router();

// All GitHub routes require authentication.
router.use(requireAuth);

// GET /api/github/:username/stats
router.get(
  "/:username/stats",
  requireParams("username"),
  githubController.getUserStats
);

// GET /api/repos/:owner/:repo/insights  (note: mounted at /api/github in app.ts)
// Re-export the repo route here for cleaner grouping.
router.get(
  "/repos/:owner/:repo/insights",
  requireParams("owner", "repo"),
  requirePro,
  githubController.getRepoInsights
);

// GET /api/github/:username/report — Pro-only PDF report.
router.get(
  "/:username/report",
  requireParams("username"),
  requirePro,
  githubController.getUserReport
);

export default router;
