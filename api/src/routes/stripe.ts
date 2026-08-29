import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as stripeController from "../controllers/stripe";

const router = Router();

// POST /api/stripe/webhook — no auth middleware; Stripe signs the request.
// express.raw() is applied in app.ts before json() for this path.
router.post("/webhook", stripeController.handleWebhook);

// Authenticated routes below.
router.use(requireAuth);

// POST /api/stripe/checkout — create a Checkout session.
router.post("/checkout", stripeController.createCheckoutSession);

// POST /api/stripe/portal — open the Billing Portal.
router.post("/portal", stripeController.createPortalSession);

export default router;
