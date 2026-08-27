import { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../types";
import { stripe } from "../services/stripe";
import { supabaseAdmin } from "../services/supabase";
import { createHttpError } from "../middleware/errorHandler";

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the Pro plan and returns the URL.
 * The frontend redirects the user to that URL.
 */
export async function createCheckoutSession(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!PRO_PRICE_ID) {
      throw createHttpError(500, "STRIPE_PRO_PRICE_ID is not configured");
    }

    // Fetch or create a Stripe customer tied to this user.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", req.user.sub)
      .single();

    let customerId = profile?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? req.user.email,
        metadata: { supabase_user_id: req.user.sub },
      });
      customerId = customer.id;

      // Persist the new customer ID so we can reuse it.
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", req.user.sub);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${FRONTEND_URL}/billing?success=true`,
      cancel_url: `${FRONTEND_URL}/billing?canceled=true`,
      // Pass the user ID so the webhook can look up the profile.
      subscription_data: {
        metadata: { supabase_user_id: req.user.sub },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session so the user can manage their
 * subscription (cancel, update payment method, etc.).
 */
export async function createPortalSession(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", req.user.sub)
      .single();

    if (!profile?.stripe_customer_id) {
      throw createHttpError(400, "No Stripe customer associated with this account");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${FRONTEND_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/stripe/webhook
 *
 * Stripe signs every webhook with STRIPE_WEBHOOK_SECRET. We verify the
 * signature before processing to prevent spoofed events.
 *
 * Handled events:
 *   - customer.subscription.created  → set status to "active"
 *   - customer.subscription.updated  → sync status
 *   - customer.subscription.deleted  → set status to "canceled"
 */
export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!WEBHOOK_SECRET) {
      throw createHttpError(500, "STRIPE_WEBHOOK_SECRET is not configured");
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      throw createHttpError(400, "Missing stripe-signature header");
    }

    let event;
    try {
      // req.body is a Buffer here because we applied express.raw() in app.ts.
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        WEBHOOK_SECRET
      );
    } catch {
      throw createHttpError(400, "Webhook signature verification failed");
    }

    const subscription = event.data.object as {
      status: string;
      metadata: { supabase_user_id?: string };
    };

    const userId = subscription.metadata?.supabase_user_id;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        if (userId) {
          const newStatus =
            subscription.status === "active" ? "active" : subscription.status;
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: newStatus })
            .eq("id", userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "canceled" })
            .eq("id", userId);
        }
        break;
      }
      default:
        // Ignore unhandled event types — just acknowledge receipt.
        break;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
