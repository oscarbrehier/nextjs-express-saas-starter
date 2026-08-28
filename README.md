# GitHub Insights

A production-ready SaaS starter that lets authenticated users explore GitHub stats for any user or repository. A **free tier** shows limited data; a **Pro tier** (Stripe subscription) unlocks full insights.

Built to showcase a clean separation between a Next.js frontend and a standalone Express API, unified by Supabase auth.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend API | Express 4, TypeScript |
| Auth | Supabase (email/password, JWT) |
| Database | Supabase (Postgres) |
| Payments | Stripe Checkout + Webhooks |
| GitHub data | GitHub REST API v2022-11-28 |

---

## Architecture Overview

```
Browser
  │
  ├─► /web  (Next.js)
  │      • Renders all UI
  │      • Supabase Auth (login / signup / session cookies)
  │      • Passes Supabase JWT → Express API
  │
  └─► /api  (Express)
         • Verifies Supabase JWT on every request
         • Calls GitHub REST API
         • Manages Stripe Checkout & webhook
         • Reads / writes Supabase `profiles` table via service-role key
```

### Auth flow (the centrepiece)

1. User logs in via Supabase on the Next.js side → Supabase issues an HS256 JWT.
2. Next.js stores the JWT in a cookie (managed by `@supabase/ssr`).
3. Client components extract the `access_token` from the session and send it to Express as `Authorization: Bearer <token>`.
4. Express middleware (`api/src/middleware/auth.ts`) verifies the JWT signature using `SUPABASE_JWT_SECRET` and attaches the decoded payload to `req.user`.
5. Downstream controllers use `req.user.sub` (the user's UUID) to look up their `profiles` row and determine their subscription tier.

### Tier gating

- **Free**: `getUserStats` returns top 3 repos.
- **Pro**: top 10 repos + repo-level insights (commit activity, contributors).
- The `requirePro` middleware can be applied to any Express route to hard-block free users.
- The frontend receives a `tier: "free" | "pro"` field in every API response and renders an upgrade prompt accordingly.

---

## Project Structure

```
/
├── api/                       Express API
│   ├── src/
│   │   ├── index.ts           Entry point
│   │   ├── app.ts             Express app setup (middleware, routes)
│   │   ├── routes/
│   │   │   ├── github.ts      GET /api/github/:username/stats
│   │   │   └── stripe.ts      POST /api/stripe/checkout|portal|webhook
│   │   ├── controllers/
│   │   │   ├── github.ts      Request handlers for GitHub routes
│   │   │   └── stripe.ts      Checkout, portal, webhook handlers
│   │   ├── services/
│   │   │   ├── github.ts      GitHub REST API client (rate-limit aware)
│   │   │   ├── stripe.ts      Stripe SDK singleton
│   │   │   └── supabase.ts    Supabase admin client
│   │   ├── middleware/
│   │   │   ├── auth.ts        JWT verification (requireAuth)
│   │   │   ├── requirePro.ts  Subscription tier gate
│   │   │   ├── errorHandler.ts  Centralised error handler
│   │   │   └── notFound.ts    404 fallback
│   │   └── types/index.ts     Shared TypeScript types
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── web/                       Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     Root layout
│   │   │   ├── page.tsx       Redirects → /dashboard
│   │   │   ├── login/         Email/password login page
│   │   │   ├── signup/        Registration page
│   │   │   └── (dashboard)/   Route group — protected pages
│   │   │       ├── layout.tsx    Dashboard shell (sidebar + topbar)
│   │   │       ├── dashboard/    GitHub search & insights
│   │   │       ├── billing/      Stripe subscription management
│   │   │       └── settings/     Password change
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx
│   │   │       └── Topbar.tsx
│   │   ├── lib/
│   │   │   ├── api.ts             Typed fetch wrapper for the Express API
│   │   │   └── supabase/
│   │   │       ├── client.ts      Browser Supabase client
│   │   │       └── server.ts      Server-side Supabase client
│   │   ├── middleware.ts           Auth redirect logic
│   │   └── types/index.ts         Shared types (mirrors API types)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   └── schema.sql             Run this in the Supabase SQL editor
│
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode)
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (classic, no special scopes needed for public repos)

---

### 1 — Supabase

1. Create a new Supabase project.
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`.
3. In **Project Settings → API**, copy:
   - `Project URL` → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. In **Project Settings → API → JWT Settings**, copy the **JWT Secret** → `SUPABASE_JWT_SECRET`

---

### 2 — Stripe

1. In the [Stripe Dashboard](https://dashboard.stripe.com), make sure you are in **Test mode**.
2. Create a product with a **9€/month** recurring price. Copy the price ID → `STRIPE_PRO_PRICE_ID`.
3. Copy your **Secret key** → `STRIPE_SECRET_KEY`.
4. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --forward-to localhost:4000/api/stripe/webhook
   ```
   Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`.

---

### 3 — Start the API

```bash
cd api
cp .env.example .env        # fill in all values
npm install
npm run dev                 # starts on http://localhost:4000
```

**`api/.env` values:**

| Variable | Description |
|---|---|
| `PORT` | Port for the Express server (default `4000`) |
| `NODE_ENV` | `development` or `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret (from Project Settings → API) |
| `GITHUB_TOKEN` | GitHub PAT — increases rate limit to 5 000 req/hr |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for the Pro plan |
| `FRONTEND_URL` | CORS origin + Stripe redirect base (e.g. `http://localhost:3000`) |

---

### 4 — Start the web frontend

```bash
cd web
cp .env.example .env.local  # fill in all values
npm install
npm run dev                 # starts on http://localhost:3000
```

**`web/.env.local` values:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser) |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Express API (e.g. `http://localhost:4000`) |

---

### 5 — Create a user

Open [http://localhost:3000/signup](http://localhost:3000/signup) and register. A `profiles` row is created automatically via the Supabase trigger.

---

## Roadmap

Ideas for extending the project:

- **Social OAuth** — GitHub / Google login via Supabase OAuth providers
- **Repo search** — dedicated page for `/repos/:owner/:repo/insights`
- **Commit graph** — visualise weekly commit activity with a chart (Recharts / Chart.js)
- **Caching** — cache GitHub responses in Redis to reduce API calls and improve latency
- **Transactional email** — send a welcome email on sign-up via Resend / Postmark
- **Admin panel** — view all users and their subscription status
- **Rate-limit UI** — surface the GitHub reset time to the user when rate-limited
- **Webhooks log** — store and display Stripe webhook events for debugging
- **Multi-repo comparison** — side-by-side stats for two repos
- **CI/CD** — GitHub Actions for type-checking and linting on push
- **Tests** — integration tests for Express routes using Supertest; component tests with Playwright
