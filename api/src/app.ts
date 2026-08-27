import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import githubRoutes from "./routes/github";
import stripeRoutes from "./routes/stripe";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

const app = express();

// --- Security & logging ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// --- Body parsing ---
// Stripe webhooks need the raw body, so we set it up before json middleware.
// The stripe route registers its own raw-body parser before this runs.
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json());

// --- Routes ---
app.use("/api/github", githubRoutes);
app.use("/api/stripe", stripeRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
